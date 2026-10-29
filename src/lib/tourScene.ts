import * as THREE from 'three';
import { isWall, type WallGrid } from './planModel';

export type TourMode = 'orbit' | 'top' | 'walk';
export type MoveKey = 'f' | 'b' | 'l' | 'r';

export const WALL_HEIGHT = 2.8; // metres
const EYE_HEIGHT = 1.6;
const BODY_RADIUS = 0.22;
const WALK_SPEED = 1.8;
const MIN_WALL = 0.12; // thinnest wall drawn, so 1-cell lines stay visible

export interface TourScene {
  setModel(grid: WallGrid, canvas: HTMLCanvasElement, metersPerCell: number): void;
  setMode(mode: TourMode): void;
  zoom(factor: number): void;
  press(key: MoveKey, down: boolean): void;
  resetWalk(): void;
  dispose(): void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/*
 * Builds a real 3D model from a wall grid: extruded walls, floor textured with the original
 * drawing, orbit / top-down cameras and a first-person walk-through with wall collision.
 */
export function createTourScene(el: HTMLElement): TourScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(Math.max(1, el.clientWidth), Math.max(1, el.clientHeight));
  const dom = renderer.domElement;
  dom.style.display = 'block';
  dom.style.width = '100%';
  dom.style.height = '100%';
  dom.style.touchAction = 'none';
  el.appendChild(dom);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf0f6);
  const camera = new THREE.PerspectiveCamera(52, Math.max(1, el.clientWidth) / Math.max(1, el.clientHeight), 0.05, 800);
  camera.rotation.order = 'YXZ';

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdbe3ec, 2.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(8, 16, 10);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xdde5ee, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  scene.add(ground);

  let model: THREE.Group | null = null;
  let ceiling: THREE.Mesh | null = null;
  let grid: WallGrid | null = null;
  let mpc = 0.1;
  let W = 0;
  let D = 0;
  let sceneSize = 10;
  let mode: TourMode = 'orbit';

  const orbit = { yaw: 0.6, pitch: 0.8, dist: 20, target: new THREE.Vector3() };
  const walk = { x: 0, z: 0, yaw: 0, pitch: 0 };
  const keys: Record<MoveKey, boolean> = { f: false, b: false, l: false, r: false };
  let turn = 0;

  const hit = (px: number, pz: number) => {
    if (!grid) return true;
    const cx = Math.floor((px + W / 2) / mpc);
    const cy = Math.floor((pz + D / 2) / mpc);
    const b = grid.bounds;
    if (b && (cx < b.x0 - 2 || cx > b.x1 + 2 || cy < b.y0 - 2 || cy > b.y1 + 2)) return true;
    return isWall(grid, cx, cy);
  };
  const blocked = (x: number, z: number, r: number) => {
    const d = r * 0.7;
    return hit(x, z) || hit(x + r, z) || hit(x - r, z) || hit(x, z + r) || hit(x, z - r) ||
      hit(x + d, z + d) || hit(x - d, z + d) || hit(x + d, z - d) || hit(x - d, z - d);
  };

  const cellX = (cx: number) => (cx + 0.5) * mpc - W / 2;
  const cellZ = (cy: number) => (cy + 0.5) * mpc - D / 2;

  function findStart() {
    const b = grid?.bounds;
    if (!grid || !b) return;
    const { cols, rows, cells } = grid;
    // distance (in cells) from every open cell to the nearest wall, by multi-source BFS
    const dist = new Int16Array(cols * rows).fill(-1);
    const queue = new Int32Array(cols * rows);
    let head = 0, tail = 0;
    for (let i = 0; i < cells.length; i++) if (cells[i]) { dist[i] = 0; queue[tail++] = i; }
    while (head < tail) {
      const i = queue[head++];
      const cx = i % cols, cy = (i / cols) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const n = ny * cols + nx;
          if (dist[n] === -1) { dist[n] = dist[i] + 1; queue[tail++] = n; }
        }
      }
    }
    const mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2;
    let bestD = -1, bestC = Infinity;
    for (let cy = b.y0; cy <= b.y1; cy++) {
      for (let cx = b.x0; cx <= b.x1; cx++) {
        const d = dist[cy * cols + cx];
        const x = cellX(cx), z = cellZ(cy);
        if (d < 0 || blocked(x, z, BODY_RADIUS * 1.6)) continue;
        const c = (cx - mx) ** 2 + (cy - my) ** 2;
        if (d > bestD || (d === bestD && c < bestC)) { bestD = d; bestC = c; walk.x = x; walk.z = z; }
      }
    }
    // face the direction with the longest clear line of sight
    let bestLen = -1;
    for (let k = 0; k < 36; k++) {
      const yaw = (k * Math.PI * 2) / 36;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      let len = 0;
      while (len < 15 && !hit(walk.x + fx * len, walk.z + fz * len)) len += 0.1;
      if (len > bestLen) { bestLen = len; walk.yaw = yaw; }
    }
    walk.pitch = 0;
  }

  function disposeModel() {
    if (!model) return;
    scene.remove(model);
    model.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(m => {
        (m as THREE.MeshStandardMaterial).map?.dispose?.();
        m.dispose();
      });
    });
    model = null;
    ceiling = null;
  }

  function setModel(g: WallGrid, canvas: HTMLCanvasElement, metersPerCell: number) {
    disposeModel();
    grid = g;
    mpc = metersPerCell;
    W = g.cols * mpc;
    D = g.rows * mpc;

    const group = new THREE.Group();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xd3dbe6, roughness: 0.85 }), Math.max(1, g.rects.length));
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    g.rects.forEach((r, i) => {
      p.set((r.x + r.w / 2) * mpc - W / 2, WALL_HEIGHT / 2, (r.y + r.h / 2) * mpc - D / 2);
      s.set(Math.max(r.w * mpc, MIN_WALL), WALL_HEIGHT, Math.max(r.h * mpc, MIN_WALL));
      m.compose(p, q, s);
      walls.setMatrixAt(i, m);
    });
    walls.count = g.rects.length;
    walls.instanceMatrix.needsUpdate = true;
    group.add(walls);

    ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 1 }));
    ceiling.rotation.x = Math.PI / 2; // faces down
    ceiling.position.y = WALL_HEIGHT;
    ceiling.visible = mode === 'walk';
    group.add(ceiling);

    scene.add(group);
    model = group;

    const b = g.bounds;
    const bw = b ? (b.x1 - b.x0 + 1) * mpc : W;
    const bd = b ? (b.y1 - b.y0 + 1) * mpc : D;
    sceneSize = Math.max(bw, bd, 4);
    orbit.target.set(b ? ((b.x0 + b.x1 + 1) / 2) * mpc - W / 2 : 0, WALL_HEIGHT * 0.25, b ? ((b.y0 + b.y1 + 1) / 2) * mpc - D / 2 : 0);
    orbit.dist = sceneSize * 1.45 + 3;
    findStart();
  }

  function stepWalk(dt: number) {
    if (turn) walk.yaw += turn * 1.9 * dt;
    const f = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);
    const s = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    if (!f && !s) return;
    const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw);
    const rx = Math.cos(walk.yaw), rz = -Math.sin(walk.yaw);
    let vx = fx * f + rx * s;
    let vz = fz * f + rz * s;
    const len = Math.hypot(vx, vz) || 1;
    vx = (vx / len) * WALK_SPEED * dt;
    vz = (vz / len) * WALK_SPEED * dt;
    if (!blocked(walk.x + vx, walk.z, BODY_RADIUS)) walk.x += vx;
    if (!blocked(walk.x, walk.z + vz, BODY_RADIUS)) walk.z += vz;
  }

  function updateCamera() {
    if (mode === 'walk') {
      camera.position.set(walk.x, EYE_HEIGHT, walk.z);
      camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
      return;
    }
    const pitch = mode === 'top' ? 1.52 : orbit.pitch;
    camera.position.set(
      orbit.target.x + Math.sin(orbit.yaw) * Math.cos(pitch) * orbit.dist,
      orbit.target.y + Math.sin(pitch) * orbit.dist,
      orbit.target.z + Math.cos(orbit.yaw) * Math.cos(pitch) * orbit.dist
    );
    camera.lookAt(orbit.target);
  }

  const clock = new THREE.Clock();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mode === 'walk') {
      stepWalk(dt);
      el.dataset.walk = `${walk.x.toFixed(3)},${walk.z.toFixed(3)}`;
    }
    updateCamera();
    renderer.render(scene, camera);
  };
  tick();

  /* --- input --- */
  let dragging = false;
  let lx = 0;
  let ly = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    try { dom.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    el.focus({ preventScroll: true });
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    if (mode === 'walk') {
      walk.yaw += dx * 0.004;
      walk.pitch = clamp(walk.pitch + dy * 0.004, -1.2, 1.2);
    } else {
      orbit.yaw -= dx * 0.008;
      if (mode === 'orbit') orbit.pitch = clamp(orbit.pitch + dy * 0.006, 0.12, 1.5);
    }
  };
  const onUp = () => { dragging = false; };
  const onWheel = (e: WheelEvent) => {
    if (mode === 'walk') return;
    e.preventDefault();
    orbit.dist = clamp(orbit.dist * Math.exp(e.deltaY * 0.001), sceneSize * 0.35, sceneSize * 4);
  };
  const keyMap: Record<string, MoveKey | 'tl' | 'tr'> = {
    w: 'f', ArrowUp: 'f', s: 'b', ArrowDown: 'b', a: 'l', d: 'r', ArrowLeft: 'tl', ArrowRight: 'tr',
  };
  const setKey = (e: KeyboardEvent, down: boolean) => {
    if (mode !== 'walk') return;
    const k = keyMap[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!k) return;
    e.preventDefault();
    if (k === 'tl') turn = down ? 1 : turn === 1 ? 0 : turn;
    else if (k === 'tr') turn = down ? -1 : turn === -1 ? 0 : turn;
    else keys[k] = down;
  };
  const onKeyDown = (e: KeyboardEvent) => setKey(e, true);
  const onKeyUp = (e: KeyboardEvent) => setKey(e, false);
  const onBlur = () => { keys.f = keys.b = keys.l = keys.r = false; turn = 0; };

  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerup', onUp);
  dom.addEventListener('pointercancel', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('keydown', onKeyDown);
  el.addEventListener('keyup', onKeyUp);
  el.addEventListener('blur', onBlur);

  const observer = new ResizeObserver(() => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  observer.observe(el);

  return {
    setModel,
    setMode(next) {
      mode = next;
      if (ceiling) ceiling.visible = next === 'walk';
      if (next === 'walk') el.focus({ preventScroll: true });
    },
    zoom(factor) { orbit.dist = clamp(orbit.dist * factor, sceneSize * 0.35, sceneSize * 4); },
    press(key, down) { keys[key] = down; },
    resetWalk: findStart,
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointercancel', onUp);
      dom.removeEventListener('wheel', onWheel);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('blur', onBlur);
      disposeModel();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      dom.remove();
    },
  };
}
