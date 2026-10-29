/*
 * Floor-plan -> wall grid.
 * Pure functions (no DOM) so the same logic can be unit-tested outside the browser.
 *
 * Pipeline:
 *  1. Mark dark pixels (ink on a light background).
 *  2. Sample them on a coarse grid. A cell is a wall if enough of it is dark, OR a thin
 *     line crosses it end to end (so 1-2 px CAD lines are not lost when downscaling).
 *  3. Drop small connected blobs (room labels, dimension text, furniture dots).
 *  4. Merge cells into the fewest rectangles, which become extruded 3D walls.
 *
 * Gaps in the drawn lines (doors, openings) stay open, so they are walkable in the 3D model.
 */

export interface Rect { x: number; y: number; w: number; h: number }

export interface WallGrid {
  cols: number;
  rows: number;
  cells: Uint8Array; // 1 = wall
  rects: Rect[];
  wallCells: number;
  ratio: number; // wall cells / all cells
  bounds: { x0: number; y0: number; x1: number; y1: number } | null;
}

export interface AnalyzeOptions {
  grid?: number; // cells along the longest side
  luminance?: number; // pixels darker than this count as ink (0-255)
  minComponent?: number; // connected blobs smaller than this many cells are removed
  fill?: number; // share of a cell that must be ink to make it a wall
  line?: number; // share of a cell a straight line must span to make it a wall
}

export function analyzePlan(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number, opts: AnalyzeOptions = {}): WallGrid {
  const gridLong = opts.grid ?? 180;
  const cut = opts.luminance ?? 150;
  const minComp = opts.minComponent ?? 12;
  const fillMin = opts.fill ?? 0.2;
  const lineMin = opts.line ?? 0.8;

  const cell = Math.max(width, height) / gridLong;
  const cols = Math.max(1, Math.ceil(width / cell));
  const rows = Math.max(1, Math.ceil(height / cell));

  const cxOf = new Int32Array(width);
  const cyOf = new Int32Array(height);
  const cellW = new Int32Array(cols);
  const cellH = new Int32Array(rows);
  for (let x = 0; x < width; x++) { cxOf[x] = Math.min(cols - 1, Math.floor(x / cell)); cellW[cxOf[x]]++; }
  for (let y = 0; y < height; y++) { cyOf[y] = Math.min(rows - 1, Math.floor(y / cell)); cellH[cyOf[y]]++; }

  const dark = new Uint32Array(cols * rows);
  const rowRun = new Uint16Array(height * cols); // ink pixels of row y inside column-cell cx
  const colRun = new Uint16Array(width * rows); // ink pixels of column x inside row-cell cy

  for (let y = 0; y < height; y++) {
    const cy = cyOf[y];
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const a = rgba[p + 3] / 255;
      const lum = (0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]) * a + 255 * (1 - a);
      if (lum < cut) {
        const cx = cxOf[x];
        dark[cy * cols + cx]++;
        rowRun[y * cols + cx]++;
        colRun[x * rows + cy]++;
      }
    }
  }

  // best straight run per cell
  const hBest = new Float32Array(cols * rows);
  const vBest = new Float32Array(cols * rows);
  for (let y = 0; y < height; y++) {
    const cy = cyOf[y];
    for (let cx = 0; cx < cols; cx++) {
      const share = rowRun[y * cols + cx] / cellW[cx];
      const i = cy * cols + cx;
      if (share > hBest[i]) hBest[i] = share;
    }
  }
  for (let x = 0; x < width; x++) {
    const cx = cxOf[x];
    for (let cy = 0; cy < rows; cy++) {
      const share = colRun[x * rows + cy] / cellH[cy];
      const i = cy * cols + cx;
      if (share > vBest[i]) vBest[i] = share;
    }
  }

  const cells = new Uint8Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx;
      const frac = dark[i] / (cellW[cx] * cellH[cy]);
      if (frac >= fillMin || hBest[i] >= lineMin || vBest[i] >= lineMin) cells[i] = 1;
    }
  }

  removeSmallBlobs(cells, cols, rows, minComp);

  let wallCells = 0;
  let x0 = cols, y0 = rows, x1 = -1, y1 = -1;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (!cells[cy * cols + cx]) continue;
      wallCells++;
      if (cx < x0) x0 = cx;
      if (cx > x1) x1 = cx;
      if (cy < y0) y0 = cy;
      if (cy > y1) y1 = cy;
    }
  }

  return {
    cols, rows, cells, rects: mergeRects(cells, cols, rows), wallCells,
    ratio: wallCells / (cols * rows),
    bounds: wallCells ? { x0, y0, x1, y1 } : null,
  };
}

/*
 * Removes text labels, dimension marks and dots. A blob is dropped when it is tiny in absolute
 * terms OR tiny compared with the main wall network (< 3% of the largest connected piece).
 * Real detached walls are normally much larger than a text label, so they survive.
 */
function removeSmallBlobs(cells: Uint8Array, cols: number, rows: number, minSize: number) {
  const label = new Int32Array(cells.length).fill(-1);
  const stack = new Int32Array(cells.length);
  const sizes: number[] = [];
  for (let start = 0; start < cells.length; start++) {
    if (!cells[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let sp = 0, count = 0;
    stack[sp++] = start;
    label[start] = id;
    while (sp) {
      const i = stack[--sp];
      count++;
      const cx = i % cols, cy = (i / cols) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const n = ny * cols + nx;
          if (cells[n] && label[n] === -1) { label[n] = id; stack[sp++] = n; }
        }
      }
    }
    sizes.push(count);
  }
  if (!sizes.length) return;
  const largest = Math.max(...sizes);
  const limit = Math.max(minSize, Math.round(largest * 0.03));
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] && sizes[label[i]] < limit) cells[i] = 0;
  }
}

/* Row runs merged downwards: far fewer 3D boxes than one per cell. */
export function mergeRects(cells: Uint8Array, cols: number, rows: number): Rect[] {
  const out: Rect[] = [];
  let open = new Map<string, Rect>();
  for (let y = 0; y < rows; y++) {
    const next = new Map<string, Rect>();
    let x = 0;
    while (x < cols) {
      if (!cells[y * cols + x]) { x++; continue; }
      const s = x;
      while (x < cols && cells[y * cols + x]) x++;
      const key = `${s}:${x - s}`;
      const prev = open.get(key);
      if (prev) { prev.h++; next.set(key, prev); }
      else { const r = { x: s, y, w: x - s, h: 1 }; out.push(r); next.set(key, r); }
    }
    open = next;
  }
  return out;
}

export function isWall(g: Pick<WallGrid, 'cols' | 'rows' | 'cells'>, cx: number, cy: number) {
  if (cx < 0 || cy < 0 || cx >= g.cols || cy >= g.rows) return true;
  return g.cells[cy * g.cols + cx] === 1;
}

/* Metres per grid cell, derived from the listing area when known. */
export function metersPerCell(g: WallGrid, areaM2?: number) {
  if (!g.bounds || !areaM2 || areaM2 <= 0) return 0.1;
  const bw = g.bounds.x1 - g.bounds.x0 + 1;
  const bh = g.bounds.y1 - g.bounds.y0 + 1;
  return Math.min(0.25, Math.max(0.04, Math.sqrt(areaM2 / (bw * bh))));
}

export type PlanQuality = 'good' | 'empty' | 'noisy';
export function planQuality(g: WallGrid): PlanQuality {
  if (g.wallCells < 40) return 'empty';
  if (g.ratio > 0.4) return 'noisy';
  return 'good';
}
