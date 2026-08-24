import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// =======================================================================
// 1. SHADER WEBGL SUR-MESURE : LE BLOB ORGANIQUE (Lusion Style)
// =======================================================================
// Ce shader crée une cellule/blob liquide qui se déforme avec du bruit 3D
// et réagit à l'interaction de la souris avec des irisations (chromatic aberration).

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  uniform vec3 uMouse;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Bruit 3D par Ashima Arts / Stefan Gustavson (Optimisé)
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  
  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pt0 = fract(P); // Fractional part for interpolation
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = Pt0; // Fractional part for interpolation
    vec3 Pf1 = Pt0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = Pf0 * Pf0 * Pf0 * (Pf0 * (Pf0 * 6.0 - 15.0) + 10.0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }

  void main() {
    vUv = uv;
    
    // Déformation par le bruit
    float t = uTime * uSpeed;
    float distortion = cnoise(normal * uNoiseDensity + t) * uNoiseStrength;
    
    // Réaction à la souris (repousse la surface)
    vec3 p = position;
    float dist = distance(p, uMouse * 3.0);
    if(dist < 1.5) {
       distortion -= (1.5 - dist) * 0.3; 
    }

    vec3 pos = p + (normal * distortion);
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uIntensity;
  uniform vec3 uColor1; // Teal
  uniform vec3 uColor2; // Dark Cyan
  uniform vec3 uColor3; // Medical White/Blue

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel effect (iridescence sur les bords)
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);

    // Mélange organique de couleurs basé sur les UV et la normale
    vec3 color = mix(uColor1, uColor2, vUv.x + sin(vUv.y * 10.0) * 0.1);
    color = mix(color, uColor3, fresnel * uIntensity);

    // Simuler un effet de verre translucide
    float alpha = 0.85 + fresnel * 0.15;

    gl_FragColor = vec4(color, alpha);
  }
`;

// =======================================================================
// 2. COMPOSANT BLOB INTERACTIF 3D
// =======================================================================
function OrganicLiquidBlob({ mousePosition }) {
  const meshRef = useRef();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 0.15 }, // Vitesse de l'ondulation
    uNoiseDensity: { value: 1.8 }, // Nombre de bosses
    uNoiseStrength: { value: 0.35 }, // Profondeur des bosses
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uIntensity: { value: 1.5 },
    uColor1: { value: new THREE.Color("#0d9488") }, // Teal 600
    uColor2: { value: new THREE.Color("#0891b2") }, // Cyan 600
    uColor3: { value: new THREE.Color("#e0f2fe") }, // Slate 100/Sky
  }), []);

  useFrame((state) => {
    const { clock } = state;
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
      
      // Interpolation douce de la position de la souris pour le shader
      meshRef.current.material.uniforms.uMouse.value.lerp(
        new THREE.Vector3(mousePosition.x * 2, -mousePosition.y * 2, 0),
        0.05
      );
      
      // Rotation lente globale
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.8}>
      {/* Une sphère avec beaucoup de segments pour une déformation douce */}
      <icosahedronGeometry args={[1, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        wireframe={false}
      />
    </mesh>
  );
}

// =======================================================================
// 3. CURSEUR MAGNÉTIQUE FLUIDE (Jelly Cursor)
// =======================================================================
function JellyCursor({ cursorTarget }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      
      // Calcul de la vélocité pour l'étirement (Jelly effect)
      const vx = x - lastMousePos.current.x;
      const vy = y - lastMousePos.current.y;
      
      setVelocity({ x: vx, y: vy });
      setMousePos({ x, y });
      
      lastMousePos.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calcul de la rotation et de l'étirement basés sur la vélocité
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
  const scaleX = 1 + Math.min(speed * 0.005, 0.5); // Limiter l'étirement max
  const scaleY = 1 - Math.min(speed * 0.005, 0.3);

  // État magnétique
  const isHovering = cursorTarget !== null;

  return (
    <>
      {/* Le point central dur */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: mousePos.x - 4,
          y: mousePos.y - 4,
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      />

      {/* Le blob extérieur (Jelly) */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none z-[9998] flex items-center justify-center backdrop-blur-[2px]"
        style={{
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)',
        }}
        animate={{
          x: isHovering ? cursorTarget.x - cursorTarget.width / 2 : mousePos.x - 24,
          y: isHovering ? cursorTarget.y - cursorTarget.height / 2 : mousePos.y - 24,
          width: isHovering ? cursorTarget.width : 48,
          height: isHovering ? cursorTarget.height : 48,
          borderRadius: isHovering ? '12px' : '50%',
          rotate: isHovering ? 0 : angle,
          scaleX: isHovering ? 1 : scaleX,
          scaleY: isHovering ? 1 : scaleY,
          backgroundColor: isHovering ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
        }}
        transition={{ 
          type: "spring", 
          stiffness: 150, 
          damping: 15, 
          mass: 0.8 
        }}
      />
    </>
  );
}

// =======================================================================
// 4. LE PROTOTYPE GLOBAL DE LA LANDING PAGE
// =======================================================================
export default function LusionInspiredPrototype() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorTarget, setCursorTarget] = useState(null);

  // Normaliser la souris pour WebGL (-1 à 1)
  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setMousePosition({ x, y });
  };

  // Magnétisme personnalisé pour les boutons
  const handleMagnetEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorTarget({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width + 20, // Pad extra
      height: rect.height + 20,
    });
  };

  const handleMagnetLeave = () => {
    setCursorTarget(null);
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-[#050505] cursor-none"
      onMouseMove={handleMouseMove}
    >
      {/* 1. SCÈNE WEBGL EN ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          <OrganicLiquidBlob mousePosition={mousePosition} />
          
          {/* Grille de fond subtile */}
          <gridHelper args={[20, 20, '#111', '#111']} position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]} />
        </Canvas>
      </div>

      {/* 2. OVERLAY NOISE (Grain texturé premium) */}
      <div className="absolute inset-0 z-[1] opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* 3. INTERFACE UTILISATEUR (Glassmorphism & Typographie Cinétique) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 sm:p-16">
        
        {/* Header */}
        <header className="flex justify-between items-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-white font-bold text-xl tracking-widest uppercase flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.8)]"></div>
            Apteka
          </motion.div>

          <nav className="flex gap-8">
            {['Vision', 'Technologie', 'Ecosystème'].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1 * (i + 1), ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={handleMagnetEnter}
                onMouseLeave={handleMagnetLeave}
                className="text-zinc-400 hover:text-white transition-colors text-sm font-medium tracking-wide cursor-none px-4 py-2"
              >
                {item}
              </motion.div>
            ))}
          </nav>
        </header>

        {/* Main Content (Typographie Immersive) */}
        <main className="flex flex-col items-center justify-center text-center mt-[-10vh] pointer-events-none">
          <div className="overflow-hidden">
            <motion.h1 
              initial={{ y: "100%", rotate: 5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="text-[10vw] font-black text-transparent bg-clip-text leading-none tracking-tighter"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.2) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              RÉVOLUTION
            </motion.h1>
          </div>
          <div className="overflow-hidden">
             <motion.h1 
              initial={{ y: "100%", rotate: -5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
              className="text-[10vw] font-black text-transparent bg-clip-text leading-none tracking-tighter flex items-center gap-4"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.2) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              <span className="italic font-light opacity-50 font-serif">de la</span> SANTÉ
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="mt-8 text-zinc-400 max-w-lg text-lg font-light leading-relaxed mix-blend-difference"
          >
            L'alliance parfaite entre l'expertise médicale et l'ingénierie créative.
            Une expérience fluide, organique, sécurisée.
          </motion.p>

          <div className="mt-12 pointer-events-auto">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1, ease: "backOut" }}
              onMouseEnter={handleMagnetEnter}
              onMouseLeave={handleMagnetLeave}
              className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white font-bold tracking-widest uppercase text-xs hover:bg-white hover:text-black transition-all duration-500 cursor-none"
            >
              Découvrir le Prototype
            </motion.button>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-between w-full text-zinc-500 text-xs font-mono tracking-widest uppercase">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            Antananarivo, MDG
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
            Creative Coding Lab
          </motion.div>
        </footer>
      </div>

      {/* 4. LE CURSEUR INTELLIGENT */}
      <JellyCursor cursorTarget={cursorTarget} />
    </div>
  );
}
