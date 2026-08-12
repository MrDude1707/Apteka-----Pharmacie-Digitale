import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// A single medicine granule floating inside the translucent capsule half
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
        emissive={data.color === '#2dd4bf' ? '#0f766e' : '#000000'}
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

// A beautifully crafted, interactive 3D Capsule (Pill)
function InteractiveCapsule() {
  const groupRef = useRef();
  const topHalfRef = useRef();
  const bottomHalfRef = useRef();

  // Generate medicine granules inside the transparent upper half
  const granules = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 16; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 0.42,
          0.1 + Math.random() * 0.85, // distribute within the top half
          (Math.random() - 0.5) * 0.42,
        ],
        size: Math.random() * 0.05 + 0.03,
        speed: Math.random() * 0.4 + 0.4,
        offset: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? '#2dd4bf' : '#ffffff', // teal vs pure clinical white
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    // Subtle auto rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
      
      // Interpolate rotation based on mouse coordinates for interactive parallax
      const targetX = (state.pointer.x * Math.PI) / 6;
      const targetY = (state.pointer.y * Math.PI) / 6;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -targetX, 0.1);
    }
  });

  return (
    <group ref={groupRef} scale={1.2}>
      {/* Floating inner granules (active pharmaceutical ingredients) */}
      <group>
        {granules.map((g, idx) => (
          <Granule key={idx} data={g} />
        ))}
      </group>

      {/* Pill Upper Half: Translucent Teal Glass */}
      <mesh ref={topHalfRef} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32, 1, false]} />
        <meshPhysicalMaterial
          color="#06b6d4" // teal
          roughness={0.05} // ultra-smooth glass surface
          metalness={0.05}
          transmission={0.88} // highly transparent
          thickness={0.8} // realistic glass wall thickness
          ior={1.48} // medical plastic refraction index
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      
      {/* Pill Top Cap: Translucent Teal Glass */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          roughness={0.05}
          metalness={0.05}
          transmission={0.88}
          thickness={0.8}
          ior={1.48}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Pill Lower Half: Solid Opaque Medical White/Teal */}
      <mesh ref={bottomHalfRef} position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32, 1, false]} />
        <meshStandardMaterial
          color="#f1f5f9" // medical pure slate-100 white
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>
      
      {/* Pill Bottom Cap: Solid Opaque Medical White */}
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Center Metal Ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.505, 0.02, 16, 64]} />
        <meshStandardMaterial color="#0d9488" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

// Glowing background digital grid
function DigitalWaveGrid() {
  const pointsRef = useRef();

  const count = 30;
  const [positions, step] = useMemo(() => {
    const pos = [];
    for (let x = 0; x < count; x++) {
      for (let z = 0; z < count; z++) {
        pos.push((x - count / 2) * 0.4);
        pos.push(0);
        pos.push((z - count / 2) * 0.4);
      }
    }
    return [new Float32Array(pos), 0];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array;
    let index = 0;
    for (let x = 0; x < count; x++) {
      for (let z = 0; z < count; z++) {
        // Create an organic waving motion
        const idx = (x * count + z) * 3 + 1; // y-coordinate
        const distance = Math.sqrt((x - count / 2) ** 2 + (z - count / 2) ** 2);
        posArray[idx] = Math.sin(distance * 0.3 - time * 2) * 0.25;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, -1.8, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#0d9488"
        size={0.07}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.4}
      />
    </points>
  );
}

export default function Scene3D() {
  return (
    <div className="w-full h-[450px] md:h-[550px] lg:h-[650px] relative">
      {/* Dynamic ambient backdrop light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-sky-400/20 to-teal-400/20 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />
      
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        eventSource={typeof document !== 'undefined' ? document.getElementById('root') : undefined}
        eventPrefix="client"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        <spotLight position={[0, 8, 2]} angle={0.3} penumbra={1} intensity={1.2} />

        <PresentationControls
          global
          config={{ mass: 2, tension: 250 }}
          snap={{ mass: 3, tension: 150 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 3, Math.PI / 3]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <InteractiveCapsule />
          </Float>
        </PresentationControls>

        <DigitalWaveGrid />

        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.5}
          scale={5}
          blur={2.4}
          far={3}
        />
      </Canvas>
    </div>
  );
}
