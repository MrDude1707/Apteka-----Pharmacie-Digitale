import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ============================================================
   APTEKA — solid geometric 3D typography
   Ported directly from apteka-3d.html for a flawless integration.
   Charcoal & copper palette: letters sit dark and metallic at
   rest, then ignite into warm ember tones on hover, like coal
   catching light. No font files — every glyph is a hand-built
   extruded path.
   ============================================================ */

const DEPTH = 5.2;
const S = 3.0;      // stroke weight (slimmer = more refined)
const H = 14;        // cap height

function shapeFromPts(pts) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  return s;
}

function extrudePiece(pts, hole) {
  const shape = shapeFromPts(pts);
  if (hole) shape.holes.push(shapeFromPts(hole));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.62,
    bevelSize: 0.52,
    bevelSegments: 5,
    curveSegments: 4
  });
  geo.computeVertexNormals();
  return geo;
}

const glyphDefs = {
  A(W = 10.5) {
    const legTop = 0.85, midY = H * 0.42, barHalf = S * 0.52;
    return [
      { pts: [[0, 0], [S, 0], [W / 2 + legTop, H - 0.35], [W / 2 - legTop, H]] },
      { pts: [[W, 0], [W - S, 0], [W / 2 - legTop, H - 0.35], [W / 2 + legTop, H]] },
      { pts: [[S * 0.5, midY - barHalf], [W - S * 0.5, midY - barHalf], [W - S * 0.5, midY + barHalf], [S * 0.5, midY + barHalf]] }
    ];
  },
  P(W = 9.5) {
    const bowlH = H * 0.56, g = 0.85;
    return [{
      pts: [[0, 0], [S, 0], [S, H - bowlH], [W, H - bowlH], [W, H], [0, H]],
      hole: [[S + g, H - bowlH + g], [W - g, H - bowlH + g], [W - g, H - g], [S + g, H - g]]
    }];
  },
  T(W = 9.5) {
    return [{ pts: [[W / 2 - S / 2, 0], [W / 2 + S / 2, 0], [W / 2 + S / 2, H - S], [W, H - S], [W, H], [0, H], [0, H - S], [W / 2 - S / 2, H - S]] }];
  },
  E(W = 9.5) {
    const mid = S * 0.46, arm = W * 0.8;
    return [{
      pts: [
        [0, 0], [W, 0], [W, S], [S, S], [S, H / 2 - mid], [arm, H / 2 - mid], [arm, H / 2 + mid], [S, H / 2 + mid],
        [S, H - S], [W, H - S], [W, H], [0, H]
      ]
    }];
  },
  K(W = 10) {
    const midY = H * 0.5, half = S * 0.46;
    return [
      { pts: [[0, 0], [S, 0], [S, H], [0, H]] },
      { pts: [[S, midY - half], [S, midY + half], [W, H], [W - 1.3 * S, H]] },
      { pts: [[S, midY + half], [S, midY - half], [W - 1.3 * S, 0], [W, 0]] }
    ];
  }
};

const palette = [
  0x5a3a22, // A - bronze
  0x8a4a24, // P - copper
  0x3d2a1c, // T - charcoal-brown
  0xb0602c, // E - burnt amber
  0x4a2f1f, // K - dark umber
  0x7a4326  // A - warm cocoa
].map(h => new THREE.Color(h));

const emberGradient = [0xff7b29, 0xffab5e, 0xff4d1f, 0xffc978, 0xff5f2e, 0xffb066].map(h => new THREE.Color(h));

const baseEmissive = new THREE.Color(0x0a0503);

function buildLetter(key, W, baseColor, emberColor, floatSeed) {
  const group = new THREE.Group();
  const pieces = glyphDefs[key](W);
  pieces.forEach(p => {
    const geo = extrudePiece(p.pts, p.hole);
    const mat = new THREE.MeshPhysicalMaterial({
      color: baseColor.clone(),
      metalness: 0.55,
      roughness: 0.32,
      clearcoat: 0.9,
      clearcoatRoughness: 0.16,
      emissive: baseEmissive.clone(),
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.baseColor = baseColor.clone();
    mesh.userData.emberColor = emberColor.clone();
    group.add(mesh);
  });

  const box = new THREE.Box3().setFromObject(group);
  const c = new THREE.Vector3();
  box.getCenter(c);
  group.children.forEach(m => m.position.sub(c));

  group.userData.hoverT = 0;
  group.userData.baseY = 0;
  group.userData.floatSeed = floatSeed;
  return group;
}

function makeGlowTexture(hex) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, hex + "aa");
  g.addColorStop(0.5, hex + "22");
  g.addColorStop(1, hex + "00");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function InteractiveBackgroundA() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- renderer / scene / camera ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 800);
    camera.position.set(0, 3, 120);

    /* ---------- lighting: warm charcoal-forge mood ---------- */
    scene.add(new THREE.AmbientLight(0x3a2416, 0.55));

    const key = new THREE.DirectionalLight(0xffdcb0, 1.2);
    key.position.set(45, 60, 70);
    scene.add(key);

    const rim = new THREE.PointLight(0xff9d4d, 2.4, 400, 2);
    rim.position.set(-70, 15, -45);
    scene.add(rim);

    const fill = new THREE.PointLight(0x8a3d1c, 0.6, 400, 2);
    fill.position.set(0, -40, 60);
    scene.add(fill);

    /* ---------- assemble the word ---------- */
    const wordGroup = new THREE.Group();
    scene.add(wordGroup);

    const lettersList = [
      { k: "A", w: 10.5 }, { k: "P", w: 9.5 }, { k: "T", w: 9.5 },
      { k: "E", w: 9.5 }, { k: "K", w: 10 }, { k: "A", w: 10.5 }
    ];
    const GAP = 2.4;
    const totalWidth = lettersList.reduce((s, l) => s + l.w, 0) + GAP * (lettersList.length - 1);
    let runX = -totalWidth / 2;

    lettersList.forEach((l, i) => {
      const lg = buildLetter(
        l.k,
        l.w,
        palette[i % palette.length],
        emberGradient[i % emberGradient.length],
        Math.random() * Math.PI * 2
      );
      lg.position.x = runX + l.w / 2;
      runX += l.w + GAP;
      wordGroup.add(lg);
    });

    /* ---------- ground glow (canvas-texture blob) ---------- */
    const groundGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 60),
      new THREE.MeshBasicMaterial({ map: makeGlowTexture("#ff7b29"), transparent: true, opacity: 0.4, depthWrite: false })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = -H / 2 - 3;
    scene.add(groundGlow);

    const backGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshBasicMaterial({ map: makeGlowTexture("#3d2211"), transparent: true, opacity: 0.6, depthWrite: false })
    );
    backGlow.position.z = -50;
    scene.add(backGlow);

    /* ---------- drifting embers (small glowing motes) ---------- */
    const emberCount = window.innerWidth < 720 ? 18 : 40;
    const emberGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff9a4d, transparent: true, opacity: 0.55 });
    const embers = new THREE.Group();
    scene.add(embers);
    for (let i = 0; i < emberCount; i++) {
      const m = new THREE.Mesh(emberGeo, emberMat.clone());
      m.position.set((Math.random() - 0.5) * 130, -30 + Math.random() * 80, -10 - Math.random() * 80);
      m.userData.speed = 0.15 + Math.random() * 0.3;
      m.userData.drift = Math.random() * Math.PI * 2;
      m.userData.baseOpacity = 0.25 + Math.random() * 0.4;
      embers.add(m);
    }

    /* ============================================================
       Camera fit — VERY BIG as requested ("bien grand, vraiment grand")
       ============================================================ */
    function fitCamera() {
      const box = new THREE.Box3().setFromObject(wordGroup);
      const size = new THREE.Vector3();
      box.getSize(size);
      const aspect = window.innerWidth / window.innerHeight;
      const halfFovY = (camera.fov * Math.PI / 180) / 2;
      const distForHeight = (size.y / 2) / Math.tan(halfFovY);
      const distForWidth = (size.x / 2) / (Math.tan(halfFovY) * aspect);
      // Recul de caméra réduit de 1.55 à 1.05 pour avoir un texte ÉNORME à l'écran
      camera.position.z = Math.max(distForHeight, distForWidth) * 1.05;
    }
    fitCamera();

    /* ============================================================
       Pointer interaction — parallax tilt + per-letter hover
       ============================================================ */
    const pointerNDC = new THREE.Vector2(0, 0);
    let targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;
    const raycaster = new THREE.Raycaster();

    let curTX = window.innerWidth / 2, curTY = window.innerHeight / 2;

    function onPointerMove(clientX, clientY) {
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = (clientY / window.innerHeight) * 2 - 1;
      pointerNDC.set(nx, ny);
      targetRotY = nx * 0.55;
      targetRotX = ny * 0.24;
      curTX = clientX;
      curTY = clientY;
    }

    const handlePointerMoveGlobal = (e) => onPointerMove(e.clientX, e.clientY);
    const handleTouchMoveGlobal = (e) => {
      if (e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("pointermove", handlePointerMoveGlobal);
    window.addEventListener("touchmove", handleTouchMoveGlobal, { passive: true });

    const allMeshes = [];
    wordGroup.children.forEach(letterGroup => {
      letterGroup.children.forEach(mesh => {
        mesh.userData.letterGroup = letterGroup;
        allMeshes.push(mesh);
      });
    });

    let hoveredGroup = null;

    function updateHoverPick() {
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(allMeshes, false);
      hoveredGroup = hits.length ? hits[0].object.userData.letterGroup : null;
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      fitCamera();
    };
    window.addEventListener("resize", handleResize);

    /* ============================================================
       Animation loop
       ============================================================ */
    const clock = new THREE.Clock();
    let curX = curTX, curY = curTY;
    let animationFrameId;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      updateHoverPick();

      curRotY += (targetRotY - curRotY) * 0.06;
      curRotX += (targetRotX - curRotX) * 0.06;
      const idle = reduceMotion ? 0 : Math.sin(t * 0.18) * 0.035;
      wordGroup.rotation.y = curRotY + idle;
      wordGroup.rotation.x = -curRotX;

      wordGroup.children.forEach(lg => {
        const target = lg === hoveredGroup ? 1 : 0;
        lg.userData.hoverT += (target - lg.userData.hoverT) * 0.14;
        const ht = lg.userData.hoverT;

        const idleBob = reduceMotion ? 0 : Math.sin(t * 0.9 + lg.userData.floatSeed) * 0.25;
        lg.position.y = lg.userData.baseY + ht * 3.4 + idleBob;
        lg.rotation.z = -0.06 * ht;
        lg.scale.setScalar(1 + ht * 0.09);

        lg.children.forEach(mesh => {
          mesh.material.color.copy(mesh.userData.baseColor).lerp(mesh.userData.emberColor, ht);
          mesh.material.emissive.copy(baseEmissive).lerp(mesh.userData.emberColor.clone().multiplyScalar(0.6), ht);
          mesh.material.emissiveIntensity = 0.4 + ht * 1.6;
          mesh.material.roughness = 0.32 - ht * 0.12;
        });
      });

      if (!reduceMotion) {
        embers.children.forEach(e => {
          e.position.y += e.userData.speed * 0.05;
          e.position.x += Math.sin(t * 0.4 + e.userData.drift) * 0.02;
          if (e.position.y > 55) e.position.y = -35;
          e.material.opacity = e.userData.baseOpacity * (0.6 + 0.4 * Math.sin(t * 1.5 + e.userData.drift));
        });
      }

      renderer.render(scene, camera);
    }

    animate();

    // Clean up WebGL resources and global listeners on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMoveGlobal);
      window.removeEventListener("touchmove", handleTouchMoveGlobal);
      window.removeEventListener("resize", handleResize);

      // Recursive cleanup
      scene.traverse((object) => {
        if (!object.isMesh) return;
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-none" 
      style={{ 
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 110% 85% at 50% 20%, #2b1710 0%, #17100b 42%, #0b0806 75%)'
      }}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-[5]" 
        style={{
          boxShadow: 'inset 0 0 20vw 3vw rgba(5,3,2,0.92)'
        }} 
      />

      {/* Grain */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.045] mix-blend-overlay z-[6]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}