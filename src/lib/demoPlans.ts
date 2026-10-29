/* Clean vector floor plans used for demos. Real listings use the plans their owners upload. */
type Seg = [number, number, number, number];
type Label = [number, number, string];

function plan(w: number, h: number, segs: Seg[], labels: Label[]) {
  const lines = segs.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join('');
  const text = labels.map(([x, y, s]) => `<text x="${x}" y="${y}">${s}</text>`).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="100%" height="100%" fill="#ffffff"/>` +
    `<g stroke="#111111" stroke-width="12" stroke-linecap="square" fill="none">${lines}</g>` +
    `<g font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#555555" text-anchor="middle">${text}</g></svg>`;
  return { svg, uri: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) };
}

const apartment = plan(1000, 700, [
  // outer walls (entrance gap in the bottom wall)
  [40, 40, 960, 40], [960, 40, 960, 660], [960, 660, 560, 660], [440, 660, 40, 660], [40, 660, 40, 40],
  // bedroom 1 | bathroom | bedroom 2
  [430, 40, 430, 400], [620, 40, 620, 400],
  // bathroom bottom wall with door
  [430, 240, 500, 240], [560, 240, 620, 240],
  // hall wall with doors to both bedrooms and the corridor
  [40, 400, 150, 400], [240, 400, 480, 400], [580, 400, 760, 400], [850, 400, 960, 400],
  // living | kitchen with opening
  [700, 400, 700, 480], [700, 560, 700, 660],
], [[235, 230, 'BED 1'], [525, 150, 'BATH'], [790, 230, 'BED 2'], [370, 540, 'LIVING'], [830, 540, 'KITCHEN']]);

const villaGround = plan(1100, 760, [
  [40, 40, 1060, 40], [1060, 40, 1060, 720], [1060, 720, 600, 720], [500, 720, 40, 720], [40, 720, 40, 40],
  [560, 40, 560, 260], [560, 340, 560, 480],
  [40, 480, 220, 480], [320, 480, 800, 480], [900, 480, 1060, 480],
  [800, 480, 800, 560], [800, 640, 800, 720],
  // stair block
  [840, 40, 840, 260], [840, 260, 1060, 260],
], [[300, 260, 'LIVING'], [700, 150, 'DINING'], [950, 150, 'STAIR'], [420, 610, 'MAJLIS'], [930, 610, 'KITCHEN']]);

const villaFirst = plan(1100, 760, [
  [40, 40, 1060, 40], [1060, 40, 1060, 720], [1060, 720, 40, 720], [40, 720, 40, 40],
  [380, 40, 380, 300], [720, 40, 720, 300],
  [40, 340, 160, 340], [250, 340, 470, 340], [560, 340, 820, 340], [910, 340, 1060, 340],
  [380, 340, 380, 720], [720, 340, 720, 720],
  [380, 540, 450, 540], [520, 540, 720, 540],
], [[210, 200, 'MASTER'], [550, 200, 'BED 2'], [890, 200, 'BED 3'], [210, 540, 'BED 4'], [550, 440, 'HALL'], [890, 540, 'BATH']]);

export const DEMO_PLANS = {
  apartment: [apartment.uri],
  villa: [villaGround.uri, villaFirst.uri],
};

export const demoPlansFor = (type?: string) => (type === 'villa' ? DEMO_PLANS.villa : DEMO_PLANS.apartment);
export const DEMO_PLAN_SVGS = { apartment: apartment.svg, villaGround: villaGround.svg, villaFirst: villaFirst.svg };
