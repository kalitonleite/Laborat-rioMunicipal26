
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import DoctorModel from './DoctorModel';

interface Doctor3DProps {
  expression: string;
  animation: string;
  isFocused: boolean;
}

const Doctor3D: React.FC<Doctor3DProps> = ({ expression, animation, isFocused }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches[0]) {
            setMousePosition({
                x: e.touches[0].clientX / window.innerWidth,
                y: e.touches[0].clientY / window.innerHeight
            });
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="w-full h-full cursor-pointer">
      <Canvas
        shadows
        camera={{ position: [0, 0, 4.5], fov: 35 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={null}>
            <Environment preset="city" />
            <DoctorModel 
                expression={expression} 
                animation={animation} 
                mousePosition={isFocused ? { x: 0.5, y: 0.3 } : mousePosition} 
            />
            <ContactShadows resolution={1024} position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2} far={1} />
        </Suspense>

        {/* Dynamic Controls based on focus */}
        <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
            makeDefault
        />
      </Canvas>
    </div>
  );
};

export default Doctor3D;
