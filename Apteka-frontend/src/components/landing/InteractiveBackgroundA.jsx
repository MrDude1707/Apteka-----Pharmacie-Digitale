import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHADERS FOR MAIN TEXT PARTICLES ---
const vertexShader = `
  attribute float aRandom;
  attribute float aSize;
  attribute float aColorMix;

  varying float vColorMix;
  varying float vRandom;
  varying float vAlpha;

  uniform float uPixelRatio;
  uniform float uTime;

  void main() {
    vColorMix = aColorMix;
    vRandom = aRandom;

    vec3 pos = position;
    // Subtle z-vibration based on noise/time to look organic
    pos.z += sin(uTime * 1.5 + aRandom * 6.2831) * 0.15;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Attenuate point size by distance to camera
    float attenuated = (220.0 / -mvPosition.z) * aSize * uPixelRatio;
    gl_PointSize = clamp(attenuated, 1.0, 9.0);

    // Subtle individual breathing/twinkle effect
    vAlpha = 0.75 + 0.25 * sin(uTime * 2.0 + aRandom * 12.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  precision mediump float;

  varying float vColorMix;
  varying float vRandom;
  varying float vAlpha;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);

    // Tight halo: falls off much faster for a premium crisp look
    float halo = smoothstep(0.30, 0.0, dist);
    // Small, hard, bright core -> gives a crisp "lit particle" look
    float core = smoothstep(0.10, 0.0, dist);
    // Extra hot specular pinpoint at the very center for a glassy glint
    float specular = smoothstep(0.035, 0.0, dist);

    vec3 baseColor = mix(uColorA, uColorB, vColorMix);
    
    // Darken the halo edge so it reads as light-in-darkness, not fog
    vec3 color = baseColor * (0.35 + 0.65 * core);
    color += vec3(1.0) * specular * 0.9; // white-hot specular reflection point

    float alpha = (halo * 0.55 + core * 0.75) * vAlpha;
    if (alpha < 0.03) discard;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

// --- SHADERS FOR STARFIELD BACKGROUND ---
const starVertexShader = `
  attribute float aRandom;
  varying float vAlpha;
  uniform float uTime;
  void main() {
    vec3 pos = position;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = clamp((80.0 / -mvPosition.z), 0.4, 2.2);
    vAlpha = 0.08 + 0.10 * sin(uTime * 0.6 + aRandom * 20.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  precision mediump float;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    float glow = smoothstep(0.5, 0.0, d);
    vec3 color = vec3(0.35, 0.9, 0.85); // Light biotech teal
    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

// --- TEXT SAMPLING FUNCTION ---
// Re-implemented from the user's high-fidelity canvas font sampler
function sampleTextPoints(text, opts) {
  const {
    fontSize = 300,
    fontFamily = "'Segoe UI', Arial, sans-serif",
    fontWeight = 700,
    gap = 4,
    letterSpacing = 0.02
  } = opts || {};

  const sampleCanvas = document.createElement('canvas');
  const ctx = sampleCanvas.getContext('2d');

  const canvasW = 2200;
  const canvasH = 600;
  sampleCanvas.width = canvasW;
  sampleCanvas.height = canvasH;

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const chars = text.split('');
  const widths = chars.map(c => ctx.measureText(c).width);
  const spacingPx = fontSize * letterSpacing;
  const totalWidth = widths.reduce((a, b) => a + b, 0) + spacingPx * (chars.length - 1);

  let cursorX = canvasW / 2 - totalWidth / 2;
  const centerY = canvasH / 2;

  chars.forEach((ch, i) => {
    ctx.fillText(ch, cursorX, centerY);
    cursorX += widths[i] + spacingPx;
  });

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH).data;
  const points = [];

  for (let y = 0; y < canvasH; y += gap) {
    for (let x = 0; x < canvasW; x += gap) {
      const idx = (y * canvasW + x) * 4;
      const alpha = imgData[idx + 3];
      if (alpha > 128) {
        // Center-relative points
        points.push({ x: x - canvasW / 2, y: -(y - canvasH / 2) });
      }
    }
  }
  return points;
}

// --- AMBIENT STARFIELD COMPONENT ---
function BiotechStarfield() {
  const pointsRef = useRef();

  const [starPositions, starRandoms] = useMemo(() => {
    const STAR_COUNT = 1000;
    const pos = new Float32Array(STAR_COUNT * 3);
    const rand = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const idx3 = i * 3;
      pos[idx3]     = (Math.random() - 0.5) * 160;
      pos[idx3 + 1] = (Math.random() - 0.5) * 100;
      pos[idx3 + 2] = (Math.random() - 0.5) * 120 - 20;
      rand[i] = Math.random();
    }
    return [pos, rand];
  }, []);

  const starUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    starUniforms.uTime.value = time;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[starPositions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[starRandoms, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={starUniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// --- MAIN PARTICLE WORD COMPONENT ---
function ParticleWord({ text }) {
  const geometryRef = useRef();
  const mainMaterialRef = useRef();

  const { viewport, camera } = useThree();

  // Mouse NDC coordinates tracker manually bound to window to bypass pointer-events-none!
  const windowMouseNDC = useRef(new THREE.Vector2(-9999, -9999));
  const isMouseActive = useRef(false);
  const targetCam = useRef(new THREE.Vector2(0, 0));

  // Click shockwave tracker
  const shockwaves = useRef([]);
  const spawnShockwaveFlag = useRef(false);

  const SHOCK_SPEED = 26.0;     // ring expansion velocity
  const SHOCK_WIDTH = 6.0;      // thickness of shockwave
  const SHOCK_STRENGTH = 10.0;   // kinetic push force
  const SHOCK_LIFE = 2.2;       // lifetime of wave in seconds

  // Sampling points using the user's template
  const rawPoints = useMemo(() => {
    return sampleTextPoints(text, {
      fontSize: 300,
      fontWeight: 700,
      gap: 4
    });
  }, [text]);

  // Find boundaries of the generated word to center and map colors
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    rawPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return {
      minX, maxX,
      minY, maxY,
      width: (maxX - minX) || 1,
      height: (maxY - minY) || 1
    };
  }, [rawPoints]);

  // Convert points to physical particles with original, current coordinates and velocity
  const particles = useMemo(() => {
    return rawPoints.map((p) => {
      const wx = p.x;
      const wy = p.y;
      const wz = (Math.random() - 0.5) * 4.5;

      return {
        ox: wx, oy: wy, oz: wz, // Local canvas-scale target positions
        x: wx + (Math.random() - 0.5) * 1200, // Spawn widely exploded
        y: wy + (Math.random() - 0.5) * 1200,
        z: wz + (Math.random() - 0.5) * 1200,
        vx: 0, vy: 0, vz: 0,
        random: Math.random(),
        size: 1.4 + Math.random() * 1.6,
        colorMix: (p.x - bounds.minX) / bounds.width,
        speedFactor: 0.8 + Math.random() * 0.5
      };
    });
  }, [rawPoints, bounds]);

  // Native typed arrays for the geometry buffers
  const [positionAttr, randomAttr, sizeAttr, colorMixAttr] = useMemo(() => {
    const pos = new Float32Array(particles.length * 3);
    const rand = new Float32Array(particles.length);
    const sz = new Float32Array(particles.length);
    const mixCol = new Float32Array(particles.length);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      pos[i * 3]     = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      rand[i]        = p.random;
      sz[i]          = p.size;
      mixCol[i]      = p.colorMix;
    }
    return [pos, rand, sz, mixCol];
  }, [particles]);

  // Uniform declarations
  const mainUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) },
    uColorA: { value: new THREE.Color(0x00ffaa) }, // Cyber Teal
    uColorB: { value: new THREE.Color(0x00bcff) }  // biotech Cyan
  }), []);

  // Window listeners bound at global level to guarantee mouse tracking across the entire screen!
  useEffect(() => {
    const handleMouseMove = (e) => {
      isMouseActive.current = true;
      
      // Compute window-level NDC manually to bypass CSS pointer-events obstacles!
      windowMouseNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      windowMouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      targetCam.current.set(nx * 4.0, -ny * 2.5);
    };

    const handleMouseLeave = () => {
      isMouseActive.current = false;
      windowMouseNDC.current.set(-9999, -9999);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        isMouseActive.current = true;
        const t = e.touches[0];
        windowMouseNDC.current.x = (t.clientX / window.innerWidth) * 2 - 1;
        windowMouseNDC.current.y = -(t.clientY / window.innerHeight) * 2 + 1;
      }
    };

    const handleMouseDown = () => {
      spawnShockwaveFlag.current = true;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleMouseDown, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleMouseDown);
    };
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const posArray = geometryRef.current?.attributes.position.array;
    if (!posArray) return;

    // Update time uniforms
    mainUniforms.uTime.value = elapsed;

    // Raycast global window-level pointer coordinates onto Z=0 plane
    const mouseWorldPos = new THREE.Vector3();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    
    state.raycaster.setFromCamera(windowMouseNDC.current, state.camera);
    state.raycaster.ray.intersectPlane(interactionPlane, mouseWorldPos);

    // Camera organic lag drift based on cursor movement
    camera.position.x += (targetCam.current.x - camera.position.x) * 0.03;
    camera.position.y += (targetCam.current.y - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // Process click-triggered shockwave spawning
    if (spawnShockwaveFlag.current && isMouseActive.current) {
      shockwaves.current.push({
        origin: mouseWorldPos.clone(),
        birth: elapsed
      });
      if (shockwaves.current.length > 6) shockwaves.current.shift(); // concurrent wave cap
      spawnShockwaveFlag.current = false;
    }

    // Responsive scaling factor enlarged by request (+22% larger sizing)
    // We target filling ~90% of viewport width or ~55% of viewport height
    const scaleX = (viewport.width * 0.90) / bounds.width;
    const scaleY = (viewport.height * 0.55) / bounds.height;
    
    // Choose the bounding scale, and cap it at the optimal full-screen scale
    const rawScale = Math.min(scaleX, scaleY);
    const finalScale = Math.min(rawScale, 0.056); // Enlarged cap from 0.045 to 0.056

    // Dynamic Physics parameters matching index (1).html
    const REPEL_RADIUS = 10.0;
    const REPEL_STRENGTH = 22.0;
    const SWIRL_STRENGTH = 14.0;
    const SPRING_STRENGTH = 0.055;
    const DAMPING = 0.90;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const idx3 = i * 3;

      const px = posArray[idx3];
      const py = posArray[idx3 + 1];
      const pz = posArray[idx3 + 2];

      // Responsive target/origin mapping
      const ox = p.ox * finalScale;
      const oy = p.oy * finalScale;
      const oz = p.oz * finalScale;

      // 1. Elastic spring pulling back toward the grid home position
      let fx = (ox - px) * (SPRING_STRENGTH * p.speedFactor);
      let fy = (oy - py) * (SPRING_STRENGTH * p.speedFactor);
      let fz = (oz - pz) * (SPRING_STRENGTH * p.speedFactor);

      // 2. Mouse magnetic vortex (repulsion + swirl curl)
      if (isMouseActive.current) {
        const dx = px - mouseWorldPos.x;
        const dy = py - mouseWorldPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS) {
          const falloff = 1.0 - dist / REPEL_RADIUS;
          const invDist = 1.0 / (dist + 0.0001);

          // Push particles away (radial outward force)
          const repelForce = falloff * falloff * REPEL_STRENGTH * p.speedFactor;
          fx += dx * invDist * repelForce;
          fy += dy * invDist * repelForce;

          // Tangential swirl vector -> gorgeous fluid vortex feel
          const swirlForce = falloff * SWIRL_STRENGTH * p.speedFactor;
          fx += -dy * invDist * swirlForce;
          fy +=  dx * invDist * swirlForce;

          // Scatter slightly on Z during repulsion
          fz += (Math.random() - 0.5) * repelForce * 0.15;
        }
      }

      // 3. Shockwave rings processing
      for (let s = 0; s < shockwaves.current.length; s++) {
        const wave = shockwaves.current[s];
        const age = elapsed - wave.birth;
        if (age < 0 || age > SHOCK_LIFE) continue;

        const ringRadius = age * SHOCK_SPEED;
        const dxw = px - wave.origin.x;
        const dyw = py - wave.origin.y;
        const distw = Math.sqrt(dxw * dxw + dyw * dyw);
        const ringDist = Math.abs(distw - ringRadius);

        if (ringDist < SHOCK_WIDTH) {
          const ringFalloff = 1.0 - ringDist / SHOCK_WIDTH;
          const lifeFade = 1.0 - age / SHOCK_LIFE;
          const invDistw = 1.0 / (distw + 0.0001);
          const force = ringFalloff * lifeFade * SHOCK_STRENGTH * p.speedFactor;
          
          fx += dxw * invDistw * force;
          fy += dyw * invDistw * force;
        }
      }

      // Physics integration
      p.vx = (p.vx + fx) * DAMPING;
      p.vy = (p.vy + fy) * DAMPING;
      p.vz = (p.vz + fz) * DAMPING;

      posArray[idx3]     += p.vx;
      posArray[idx3 + 1] += p.vy;
      posArray[idx3 + 2] += p.vz;
    }

    // Flag geometry's attributes as dirty
    geometryRef.current.attributes.position.needsUpdate = true;

    // Prune completed shockwaves
    while (shockwaves.current.length && (elapsed - shockwaves.current[0].birth) > SHOCK_LIFE) {
      shockwaves.current.shift();
    }
  });

  return (
    <group>
      {/* Main Interactive Word Points */}
      <points>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[positionAttr, 3]}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            args={[randomAttr, 1]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizeAttr, 1]}
          />
          <bufferAttribute
            attach="attributes-aColorMix"
            args={[colorMixAttr, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={mainMaterialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={mainUniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// --- CORE CONTAINER EXPORT ---
export default function InteractiveBackgroundA({ text = "APTEKA" }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70">
      <Canvas
        camera={{ position: [0, 0, 60], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Cinematic Starfield Background */}
        <BiotechStarfield />
        
        {/* Interactive Word system (reflection and grid helper removed on user's request) */}
        <ParticleWord text={text} />
      </Canvas>
    </div>
  );
}
