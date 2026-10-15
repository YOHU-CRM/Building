import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildMassing, floorColor, MatKey, Prim } from '../lib/massingModel';

/**
 * 3D HÌNH KHỐI — dựng từ chính mặt bằng 2D (cùng bộ lập mặt bằng), không gọi API, xoay được trên điện thoại.
 * Kéo 1 ngón: xoay · chụm 2 ngón: phóng to · kéo 2 ngón: di chuyển.
 */
interface Props {
  dimensions?: string;
  floors?: number;
  rooms?: any;
  theme: string;
  lang?: string;
  fengShuiAnalysis?: any;
  desiredDirection?: string;
  frontSetbackM?: number | string;
  backSetbackM?: number | string;
  roofType?: string;
  customerName?: string;
  /** ảnh chụp 3D (PNG data URL) — dùng cho bước ảnh phối cảnh */
  onSnapshot?: (dataUrl: string) => void;
}

const MAT_COLOR: Record<string, { c: string; o?: number; r?: number; m?: number }> = {
  wall_ext: { c: '#f4efe6', r: 0.9 }, wall_int: { c: '#ffffff', r: 0.95 }, slab: { c: '#d6d3cd', r: 0.9 }, plinth: { c: '#b8b2a7', r: 1 },
  glass: { c: '#7cc4e8', o: 0.45, r: 0.1, m: 0.1 }, door_main: { c: '#8b5a2b', r: 0.6 }, door: { c: '#a16207' }, rolling: { c: '#94a3b8', m: 0.4, r: 0.5 },
  roof_ton: { c: '#4b6584', r: 0.5, m: 0.3 }, roof_ngoi: { c: '#b4532a', r: 0.85 }, roof_btct: { c: '#cfcac1', r: 0.9 }, roof_thai: { c: '#7a3b2e', r: 0.8 },
  ground: { c: '#9cc58a', r: 1 }, lot: { c: '#c9dfb6', r: 1 }, pond: { c: '#5aa9e6', o: 0.85, r: 0.15, m: 0.1 }, garden: { c: '#7fbf6a', r: 1 }, yard: { c: '#d9d4c7', r: 1 },
  porch: { c: '#c8b79e', r: 0.9 }, column: { c: '#efe9df', r: 0.8 }, railing: { c: '#64748b', o: 0.55, r: 0.4, m: 0.5 }, trunk: { c: '#7c5a3a', r: 1 }, leaf: { c: '#3f8f46', r: 1 },
  stair: { c: '#9ca3af', r: 0.8 }, stone: { c: '#8d8a84', r: 1 }, outkitchen: { c: '#e7d3b8', r: 0.95 }, chimney: { c: '#7c6f64', r: 1 }, walkway_roof: { c: '#64748b', r: 0.6, m: 0.3 }
};

function parseDims(d?: string) {
  const s = String(d || '').toLowerCase().replace(/m2|m²/g, '').replace(/,/g, '.');
  const m = s.match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (m) return { w: parseFloat(m[1]), l: parseFloat(m[2]) };
  const a = parseFloat(s) || 100; const w = Math.round(Math.sqrt(a / 2.5)) || 5;
  return { w, l: Math.round(a / w) };
}

function labelSprite(text: string, color: string, scale = 1) {
  const c = document.createElement('canvas');
  const fs = 44;
  const ctx = c.getContext('2d')!;
  ctx.font = `800 ${fs}px Arial, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 28;
  c.width = w; c.height = fs + 22;
  const g = c.getContext('2d')!;
  g.font = `800 ${fs}px Arial, sans-serif`;
  g.fillStyle = 'rgba(255,255,255,0.86)';
  const rr = 14; g.beginPath(); g.moveTo(rr, 0); g.arcTo(w, 0, w, c.height, rr); g.arcTo(w, c.height, 0, c.height, rr); g.arcTo(0, c.height, 0, 0, rr); g.arcTo(0, 0, w, 0, rr); g.fill();
  g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 14, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  // cỡ chữ cố định trên màn hình (không nhỏ đi khi nhìn xa)
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
  const h = 0.045 * scale;
  sp.scale.set(h * (w / c.height), h, 1);
  sp.renderOrder = 10;
  return sp;
}

function gableGeometry(p: Extract<Prim, { t: 'gable' }>) {
  const { x0, x1, z0, z1, y, rise, axis } = p;
  const v: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => v.push(...a, ...b, ...c);
  const quad = (a: number[], b: number[], c: number[], d: number[]) => { tri(a, b, c); tri(a, c, d); };
  const A = [x0, y, z0], B = [x1, y, z0], C = [x1, y, z1], D = [x0, y, z1];
  if (axis === 'x') {
    const zm = (z0 + z1) / 2, R0 = [x0, y + rise, zm], R1 = [x1, y + rise, zm];
    quad(A, B, R1, R0); quad(C, D, R0, R1); tri(A, R0, D); tri(B, C, R1); quad(A, D, C, B);
  } else {
    const xm = (x0 + x1) / 2, R0 = [xm, y + rise, z0], R1 = [xm, y + rise, z1];
    quad(B, C, R1, R0); quad(D, A, R0, R1); tri(A, B, R0); tri(C, D, R1); quad(A, D, C, B);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

export default function Massing3DViewer({ dimensions, floors = 1, rooms, theme, lang = 'vi', fengShuiAnalysis, desiredDirection, frontSetbackM, backSetbackM, roofType, customerName, onSnapshot }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; groups: THREE.Object3D[]; target: THREE.Vector3; dist: number } | null>(null);
  const [view, setView] = useState<number>(0);          // 0 = toàn nhà, k = xem tầng k (bóc mái & các tầng trên)
  const [autoRotate, setAutoRotate] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { w, l } = parseDims(dimensions);
  const built = useMemo(() => {
    try {
      return { model: buildMassing({ widthM: w, lengthM: l, totalFloors: Math.max(1, floors || 1), rooms, fengShuiAnalysis, desiredDirection, frontSetbackM, backSetbackM, roofType }), error: null as string | null };
    } catch (e: any) { return { model: null, error: 'Chưa dựng được 3D: ' + String(e?.message || e) }; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, l, floors, JSON.stringify(rooms || {}), desiredDirection, frontSetbackM, backSetbackM, roofType, JSON.stringify(fengShuiAnalysis?.favorableDirections || [])]);
  const model = built.model;
  useEffect(() => { setErr(built.error); }, [built]);

  /* dựng cảnh */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !model) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      setErr('Thiết bị không hỗ trợ WebGL để xem 3D. Hãy mở bằng Chrome / Safari bản mới.');
      return;
    }
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? '#0f172a' : '#e8f1fb');
    scene.fog = new THREE.Fog(scene.background as THREE.Color, 120, 260);

    const { x0, x1, z0, z1, yMax } = model.bbox;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const span = Math.max(x1 - x0, z1 - z0, yMax * 2);
    const camera = new THREE.PerspectiveCamera(42, wrap.clientWidth / wrap.clientHeight, 0.1, 600);
    const target = new THREE.Vector3(cx, yMax * 0.3, cz);
    const dist = span * 1.05;
    camera.position.set(cx - dist * 0.55, dist * 0.55, cz + dist * 0.8);   // góc nhìn mặt tiền chéo trái
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 4; controls.maxDistance = span * 3;
    controls.update();

    // ánh sáng: nắng từ hướng Nam lệch Tây (chiều), theo hướng thật của nhà
    scene.add(new THREE.HemisphereLight('#ffffff', '#8a9a7a', 1.1));
    scene.add(new THREE.AmbientLight('#ffffff', 0.35));
    const sun = new THREE.DirectionalLight('#fff6e5', 1.6);
    const sunBearing = 210, phi = (sunBearing - model.facingDeg) * Math.PI / 180;
    const vx = -Math.sin(phi), vy = -Math.cos(phi);
    sun.position.set(cx + vx * span, span * 0.9, cz - vy * span);
    sun.target.position.set(cx, 0, cz);
    sun.castShadow = true;
    sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = span * 4;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);

    // vật liệu dùng chung
    const mats = new Map<string, THREE.Material>();
    const mat = (k: MatKey) => {
      if (mats.has(k)) return mats.get(k)!;
      let m: THREE.Material;
      if (k.startsWith('floor_')) m = new THREE.MeshStandardMaterial({ color: floorColor(k.slice(6)), roughness: 0.9 });
      else {
        const d = MAT_COLOR[k] || { c: '#cccccc' };
        m = new THREE.MeshStandardMaterial({ color: d.c, roughness: d.r ?? 0.8, metalness: d.m ?? 0, transparent: d.o !== undefined, opacity: d.o ?? 1, side: k.startsWith('roof') || k === 'wall_ext' || k === 'walkway_roof' ? THREE.DoubleSide : THREE.FrontSide });
      }
      mats.set(k, m); return m;
    };
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
    const sphGeo = new THREE.SphereGeometry(1, 16, 12);
    const extraGeos: THREE.BufferGeometry[] = [];

    // nhóm theo tầng để bóc lớp: index 0 = khu đất, 1..n = tầng, n+1 = mái
    const groups: THREE.Object3D[] = [];
    for (let i = 0; i <= model.floors + 1; i++) { const g = new THREE.Group(); g.userData.floor = i; scene.add(g); groups.push(g); }
    const labelGroup = new THREE.Group(); scene.add(labelGroup);

    model.prims.forEach(p => {
      let obj: THREE.Object3D | null = null;
      if (p.t === 'box') {
        const m = new THREE.Mesh(boxGeo, mat(p.mat)); m.scale.set(p.sx, p.sy, p.sz); m.position.set(p.x, p.y, p.z);
        m.castShadow = p.mat !== 'glass' && p.tag !== 'site' && p.tag !== 'roomFloor'; m.receiveShadow = true; obj = m;
        if (p.tag === 'roomFloor') m.userData.roomFloor = true;
      } else if (p.t === 'gable') {
        const g = gableGeometry(p); extraGeos.push(g);
        const m = new THREE.Mesh(g, mat(p.mat)); m.castShadow = true; m.receiveShadow = true; obj = m;
      } else if (p.t === 'cyl') {
        const m = new THREE.Mesh(cylGeo, mat(p.mat)); m.scale.set(p.r, p.h, p.r); m.position.set(p.x, p.y, p.z); m.castShadow = true; m.receiveShadow = true; obj = m;
      } else if (p.t === 'sphere') {
        const m = new THREE.Mesh(sphGeo, mat(p.mat)); m.scale.set(p.r, p.r * 0.85, p.r); m.position.set(p.x, p.y, p.z); m.castShadow = true; obj = m;
      } else if (p.t === 'label') {
        const sp = labelSprite(p.text, p.color, (p.tag === 'roomLabel' ? 0.8 : 1) * (isMobile ? 0.8 : 1));
        sp.position.set(p.x, p.y, p.z);
        sp.userData = { floor: p.floor, roomLabel: p.tag === 'roomLabel' };
        labelGroup.add(sp);
        return;
      }
      if (obj) {
        obj.userData.tag = (p as any).tag;
        groups[Math.min(groups.length - 1, Math.max(0, p.floor))].add(obj);
      }
    });

    ctxRef.current = { renderer, scene, camera, controls, groups, target, dist };

    const ro = new ResizeObserver(() => {
      const W = wrap.clientWidth, H = wrap.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    });
    ro.observe(wrap);
    let raf = 0;
    const loop = () => { raf = requestAnimationFrame(loop); if (document.hidden) return; controls.update(); renderer.render(scene, camera); };
    loop();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      boxGeo.dispose(); cylGeo.dispose(); sphGeo.dispose(); extraGeos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
      labelGroup.children.forEach(c => { const s = c as THREE.Sprite; (s.material as THREE.SpriteMaterial).map?.dispose(); s.material.dispose(); });
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
      ctxRef.current = null;
    };
  }, [model, theme]);

  /* xem từng tầng: ẩn mái & các tầng trên, hiện tên phòng của tầng đang xem */
  useEffect(() => {
    const c = ctxRef.current; if (!c || !model) return;
    c.groups.forEach(g => {
      const f = g.userData.floor as number;
      g.visible = view === 0 ? true : f <= view;
      g.children.forEach(o => { if (o.userData.tag === 'roof') o.visible = view === 0; });   // bóc cả mái hiên khi xem trong nhà
    });
    // tầng đang xem: ẩn sàn của tầng trên (thuộc nhóm tầng trên) – đã ẩn theo nhóm
    c.scene.children.forEach(ch => {
      if (!(ch instanceof THREE.Group) || ch.userData.floor !== undefined) return;
      ch.children.forEach(s => {
        const u = s.userData as any;
        s.visible = u.roomLabel ? (view !== 0 && u.floor === view) : (view === 0 || u.floor === 0);
      });
    });
  }, [view, model]);

  useEffect(() => { const c = ctxRef.current; if (c) { c.controls.autoRotate = autoRotate; c.controls.autoRotateSpeed = 1.2; } }, [autoRotate, model]);

  const setCam = (mode: 'front' | 'top' | 'corner') => {
    const c = ctxRef.current; if (!c) return;
    const t = c.target, d = c.dist;
    if (mode === 'front') c.camera.position.set(t.x, d * 0.25, t.z + d * 1.0);
    if (mode === 'top') c.camera.position.set(t.x, d * 1.25, t.z + 0.01);
    if (mode === 'corner') c.camera.position.set(t.x - d * 0.55, d * 0.55, t.z + d * 0.8);
    c.controls.update();
  };
  const [sent, setSent] = useState(false);
  /** gửi ảnh 3D sang khu "Ảnh phối cảnh" làm khung hình khối (JPEG cho nhẹ) */
  const useForPerspective = () => {
    const c = ctxRef.current; if (!c) return;
    c.controls.update(); c.renderer.render(c.scene, c.camera);
    onSnapshot?.(c.renderer.domElement.toDataURL('image/jpeg', 0.9));
    setSent(true); setTimeout(() => setSent(false), 2500);
  };
  const snapshot = () => {
    const c = ctxRef.current; if (!c) return;
    c.controls.update(); c.renderer.render(c.scene, c.camera);
    const url = c.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `3D_hinh_khoi_${String(customerName || 'nha').replace(/\s+/g, '_')}.png`; a.click();
  };

  const dark = theme === 'dark';
  const btn = (active: boolean) => `px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${active ? 'bg-amber-500 text-slate-950 font-black shadow' : dark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;

  return (
    <div className={`mt-6 p-4 sm:p-6 rounded-2xl border ${dark ? 'bg-[#101524] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div>
          <h4 className="text-sm sm:text-base font-black uppercase tracking-tight">🧊 {lang === 'vi' ? '3D Hình Khối — dựng từ mặt bằng' : '3D Massing Model'}</h4>
          <p className="text-xs text-slate-400">{model ? model.summary.join(' · ') : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onSnapshot && <button onClick={useForPerspective} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-md min-h-[40px] cursor-pointer">{sent ? '✓ Đã gửi sang Ảnh phối cảnh' : '🎨 Dùng làm khung ảnh phối cảnh'}</button>}
          <button onClick={snapshot} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md min-h-[40px] cursor-pointer">📸 {lang === 'vi' ? 'Tải ảnh 3D (PNG)' : 'Download PNG'}</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button className={btn(view === 0)} onClick={() => setView(0)}>🏠 Toàn nhà</button>
        {model && Array.from({ length: model.floors }, (_, i) => i + 1).map(f => (
          <button key={f} className={btn(view === f)} onClick={() => setView(f)}>Xem trong tầng {f}</button>
        ))}
        <span className="w-px bg-slate-500/30 mx-1" />
        <button className={btn(false)} onClick={() => setCam('corner')}>Góc chéo</button>
        <button className={btn(false)} onClick={() => setCam('front')}>Mặt tiền</button>
        <button className={btn(false)} onClick={() => setCam('top')}>Nhìn từ trên</button>
        <button className={btn(autoRotate)} onClick={() => setAutoRotate(v => !v)}>{autoRotate ? '⏸ Dừng xoay' : '🔄 Tự xoay'}</button>
      </div>

      <div ref={wrapRef} className={`relative w-full h-[420px] sm:h-[540px] rounded-xl overflow-hidden border ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        {err && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-amber-500">{err}</div>}
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-950/80 text-[10px] sm:text-[11px] text-slate-200 pointer-events-none">
          Kéo 1 ngón: xoay · chụm 2 ngón: phóng to · kéo 2 ngón: di chuyển
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
        Mô hình khối minh họa tỷ lệ, số tầng, mái, cửa và hướng nhà theo đúng mặt bằng 2D (chữ B = hướng Bắc). Vật liệu, màu sắc, chi tiết mặt tiền sẽ được thể hiện ở bước ảnh phối cảnh.
      </p>
    </div>
  );
}
