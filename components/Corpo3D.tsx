
import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface ExamMapping {
  orgao: string;
  status: 'normal' | 'alerta' | 'critico';
  exame_nome: string;
}

function Model({ exames }: { exames: ExamMapping[] }) {
  // O usuário disse que o nome é "anatomia do corpo" em public
  // Vamos tentar carregar como .glb
  const { scene } = useGLTF('/anatomia do corpo.glb');

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const meshName = child.name.toLowerCase();
        
        // Mapeamento fornecido pelo usuário:
        // cerebro -> Brain
        // figado -> Liver
        // rins -> Kidneys
        
        let targetOrgao = '';
        if (meshName.includes('brain')) targetOrgao = 'cerebro';
        else if (meshName.includes('liver')) targetOrgao = 'figado';
        else if (meshName.includes('kidney') || meshName.includes('rim')) targetOrgao = 'rins';

        const exame = exames.find(e => e.orgao === targetOrgao);
        
        if (exame && (child as THREE.Mesh).material) {
            const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (exame.status === 'critico') material.color.set('#ef4444');
            else if (exame.status === 'alerta') material.color.set('#facc15');
            else material.color.set('#22c55e');
            
            // Highlight effect
            material.emissive = material.color.clone().multiplyScalar(0.2);
        } else {
            // Default color for non-mapped organs
            if ((child as THREE.Mesh).material) {
                ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set('#e2e8f0');
                ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.5;
                ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).transparent = true;
            }
        }
      }
    });
  }, [scene, exames]);

  return <primitive object={scene} scale={2} position={[0, -2, 0]} />;
}

export default function Corpo3D({ exames }: { exames: ExamMapping[] }) {
  return (
    <div className="w-full h-[500px] bg-slate-900 rounded-[32px] overflow-hidden relative border border-white/10 shadow-2xl">
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Mapa Biométrico 3D
        </h3>
      </div>
      
      <div className="absolute bottom-6 right-6 z-10 flex gap-4">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
            <span className="text-[10px] font-bold text-white/60 uppercase">Normal</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
            <span className="text-[10px] font-bold text-white/60 uppercase">Alerta</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <span className="text-[10px] font-bold text-white/60 uppercase">Crítico</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <React.Suspense fallback={null}>
          <Model exames={exames} />
          <Environment preset="city" />
          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        </React.Suspense>
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4} />
      </Canvas>
      
      <div className="absolute inset-0 pointer-events-none border-[20px] border-slate-900/10 rounded-[32px]"></div>
    </div>
  );
}
