"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

function Spinner({ url }: { url: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={ref}>
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
    </group>
  );
}

export default function ScenePreview({ url }: { url: string }) {
  return (
    <Canvas
      camera={{ position: [3, 2, 5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ scene }) => {
        scene.background = null;
      }}
    >
      <Spinner url={url} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.0} />
      <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#88aaff" />
    </Canvas>
  );
}