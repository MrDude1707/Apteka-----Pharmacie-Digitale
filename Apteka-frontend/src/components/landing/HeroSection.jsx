import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PresentationControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// =======================================================================
// SHADER DU FLUIDE INTERNE MAGIQUE
// =======================================================================
const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Bruit 3D Ashima Arts
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  
  float cnoise(vec3 P){
    vec3 Pi0 = floor(P);
    vec3 Pt0 = fract(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = Pt0;
    vec3 Pf1 = Pt0 - vec3(1.0);
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
    
    // Distorsion ultra organique
    float t = uTime * uSpeed;
    float distortion = cnoise(normal * uNoiseDensity + t) * uNoiseStrength;
    
    vec3 pos = position + (normal * distortion);
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uIntensity;
  uniform vec3 uColor1; 
  uniform vec3 uColor2; 

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Effet Fresnel puissant pour faire briller l'intérieur
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 2.0);

    // Mélange organique dynamique
    vec3 color = mix(uColor1, uColor2, vUv.y + sin(vUv.x * 20.0) * 0.2);
    color += fresnel * 0.8; // Ajout d'éclat sur les bords

    gl_FragColor = vec4(color, 0.95);
  }
`;

// =======================================================================
// COMPOSANTS 3D : LA GÉLULE MAGIQUE
// =======================================================================
function Granule({ data }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime() * data.speed;
      meshRef.current.position.y = data.position[1] + Math.sin(time + data.offset) * 0.08;
      meshRef.current.position.x = data.position[0] + Math.cos(time + data.offset) * 0.03;
      meshRef.current.position.z = data.position[2] + Math.sin(time * 0.5 + data.offset) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={data.position}>
      <sphereGeometry args={[data.size, 16, 16]} />
      <meshStandardMaterial 
        color={data.color} 
        roughness={0.15} 
        metalness={0.1}
        emissive={data.color === '#00f0ff' ? '#083344' : '#000000'}
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

function LiquidCapsule({ mousePosition }) {
  const groupRef = useRef();
  const liquidRef = useRef();
  const glassRef = useRef();

  const granules = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 15; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 0.42,
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 0.42,
        ],
        size: Math.random() * 0.04 + 0.02,
        speed: Math.random() * 0.4 + 0.4,
        offset: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? '#00f0ff' : '#ffffff', // teal/cyan vs clinical white
      });
    }
    return arr;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 0.3 }, 
    uNoiseDensity: { value: 2.5 }, 
    uNoiseStrength: { value: 0.35 }, 
    uIntensity: { value: 2.5 },
    uColor1: { value: new THREE.Color("#06b6d4") }, // Cyan brillant
    uColor2: { value: new THREE.Color("#10b981") }, // Emeraude médical
  }), []);

  useFrame((state) => {
    const { clock } = state;
    const time = clock.getElapsedTime();

    if (liquidRef.current) {
      liquidRef.current.material.uniforms.uTime.value = time;
      // Le fluide tourne doucement à l'intérieur
      liquidRef.current.rotation.y = time * 0.2;
    }

    if (groupRef.current) {
      // Rotation flottante naturelle
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.2;
      groupRef.current.rotation.z = Math.cos(time * 0.2) * 0.1;
      groupRef.current.rotation.x = 0.4 + Math.sin(time * 0.4) * 0.1;

      // Réactivité à la souris beaucoup plus ample et fluide
      const targetX = mousePosition.y * 0.8;
      const targetY = mousePosition.x * 0.8;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.4 + targetX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
    }
  });

  return (
    <group ref={groupRef} scale={1.7}>
      
      {/* 1. Noyau Lumineux Central */}
      <mesh>
        <capsuleGeometry args={[0.2, 0.6, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* 1.5. Granules de principes actifs flottants (Hybride de Scene3D) */}
      <group>
        {granules.map((g, idx) => (
          <Granule key={idx} data={g} />
        ))}
      </group>

      {/* 2. Le Fluide Organique (Intérieur) */}
      <mesh ref={liquidRef}>
        <capsuleGeometry args={[0.42, 1.2, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
        />
      </mesh>

      {/* 3. La Coque en Verre Médical (Extérieur) Ultra-Réaliste */}
      <mesh ref={glassRef}>
        <capsuleGeometry args={[0.5, 1.3, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1} // Verre pur
          opacity={1}
          metalness={0.2}
          roughness={0.0} // Surface parfaite
          ior={1.4} // Indice de réfraction du verre fin
          thickness={1.5}
          specularIntensity={2}
          specularColor="#ffffff"
          clearcoat={1}
          clearcoatRoughness={0}
          side={THREE.DoubleSide}
          transparent={true}
        />
      </mesh>
      
      {/* 4. Anneau Central Métallique Poli */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.505, 0.02, 32, 100]} />
        <meshStandardMaterial color="#0d9488" metalness={1} roughness={0.1} />
      </mesh>

      {/* 5. Particules Magiques (Poussière de lumière) */}
      <Sparkles count={80} scale={2.5} size={3} speed={0.4} opacity={0.6} color="#4fd1c5" />
    </group>
  );
}

// =======================================================================
// SECTION HERO PRINCIPALE
// =======================================================================
export default function HeroSection({ onConnectClick, onHowItWorksClick, handleQuickDemoLogin }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setMousePosition({ x, y });
  };

  return (
    <section 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]"
      onMouseMove={handleMouseMove}
    >
      {/* OVERLAY GRAIN (Bruit cinématographique) */}
      <div 
        className="absolute inset-0 z-[1] opacity-[0.15] pointer-events-none mix-blend-overlay" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
        }} 
      />

      {/* LUMIÈRES D'AMBIANCE (Glow effects) */}
      <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* CONTENEUR GRILLE (Séparation Texte / 3D) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-20 lg:mt-0">
        
        {/* COLONNE GAUCHE : TEXTE DIRECT ET FRANC */}
        <div className="lg:col-span-7 flex flex-col items-start text-left pointer-events-none">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-[10px] font-bold text-teal-400 font-mono tracking-widest uppercase">Disponible à Madagascar</span>
          </motion.div>

          {/* Typographie Immersive & Directe */}
          <div className="overflow-hidden mb-2">
            <motion.h1 
              initial={{ y: "100%", rotate: 2 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text leading-[1.1] tracking-tight"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              LA PHARMACIE.
            </motion.h1>
          </div>
          
          <div className="overflow-hidden">
             <motion.h1 
              initial={{ y: "100%", rotate: -2 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text leading-[1.1] tracking-tight flex items-center gap-4"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              RÉINVENTÉE.
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.6 }}
            className="mt-8 text-zinc-400 max-w-xl text-base sm:text-lg font-normal leading-relaxed drop-shadow-md"
          >
            Fini les ordonnances papier perdues et les ruptures de stock surprises. 
            <strong> Apteka</strong> connecte directement votre médecin à votre pharmacie. 
            Recevez votre traitement sur votre téléphone et récupérez-le sans attendre.
          </motion.p>

          {/* Boutons d'Action */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: "backOut" }}
            className="mt-10 flex flex-wrap items-center gap-6 pointer-events-auto"
          >
            <button
              onClick={onConnectClick}
              className="group relative px-8 py-4 bg-teal-500/10 backdrop-blur-md border border-teal-500/30 rounded-full text-white font-bold tracking-widest uppercase text-xs hover:border-teal-400 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-500/30 to-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <span className="relative z-10 flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.8)]"></div>
                Ouvrir mon espace
              </span>
            </button>

            <button
              onClick={handleQuickDemoLogin}
              className="px-6 py-4 text-xs font-bold text-zinc-400 hover:text-white tracking-widest uppercase transition-colors"
            >
              Voir une démo
            </button>
          </motion.div>
        </div>

        {/* COLONNE DROITE : SCÈNE 3D MAGIQUE */}
        <div className="col-span-1 lg:col-span-5 h-[50vh] lg:h-[80vh] w-full relative pointer-events-none">
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <Environment preset="studio" />
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
            
            {/* Lumière colorée intense pour le côté magique */}
            <spotLight position={[-5, 5, 5]} angle={0.5} penumbra={1} intensity={5} color="#06b6d4" />
            <pointLight position={[0, -3, 2]} intensity={2} color="#10b981" />
            
            <PresentationControls
              global
              config={{ mass: 2, tension: 250 }}
              snap={{ mass: 3, tension: 150 }}
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Math.PI / 3, Math.PI / 3]}
            >
              <Float speed={2.5} rotationIntensity={1} floatIntensity={2}>
                <LiquidCapsule mousePosition={mousePosition} />
              </Float>
            </PresentationControls>
          </Canvas>
        </div>
        
      </div>
    </section>
  );
}