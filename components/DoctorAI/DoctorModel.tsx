
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DoctorModelProps {
  expression: string;
  animation: string;
  mousePosition: { x: number; y: number };
}

const DoctorModel: React.FC<DoctorModelProps> = ({ expression, animation, mousePosition }) => {
  const group = useRef<THREE.Group>(null);
  // Use GLTF loader with the path to the model
  const { scene, animations, nodes, materials } = useGLTF('/medico.glb') as any;
  const { actions, names } = useAnimations(animations, group);

  const [currentAction, setCurrentAction] = useState<string>('idle');

  // Morph targets mappings (will try to find them in the model)
  const EXPRESSIONS: Record<string, Record<string, number>> = {
    neutral: { mouthSmile: 0, eyeWideLeft: 0, eyeWideRight: 0, jawOpen: 0 },
    happy: { mouthSmile: 0.8, eyeWideLeft: 0.2, eyeWideRight: 0.2, eyeBlinkLeft: 0, eyeBlinkRight: 0 },
    thinking: { mouthPucker: 0.4, eyeWideLeft: 0, eyeWideRight: 0, browInnerUp: 0.5 },
    alert: { eyeWideLeft: 0.8, eyeWideRight: 0.8, browInnerUp: 0.8, jawOpen: 0.1 }
  };

  useEffect(() => {
    // Handle Animations
    const nextAction = animation || 'idle';
    
    // Find closest match in available actions
    let actionName = names.find(n => n.toLowerCase().includes(nextAction.toLowerCase())) || names[0];
    
    if (actionName && actions[actionName]) {
      const action = actions[actionName];
      action.reset().fadeIn(0.5).play();
      
      // Stop previous action if it's different
      if (currentAction !== actionName && actions[currentAction]) {
        actions[currentAction].fadeOut(0.5);
      }
      setCurrentAction(actionName);
    }
  }, [animation, actions, names, currentAction]);

  useFrame((state) => {
    if (!group.current) return;

    // Head tracking logic
    const head = group.current.getObjectByName('Head') || group.current.getObjectByName('head');
    const neck = group.current.getObjectByName('Neck') || group.current.getObjectByName('neck');

    if (head) {
      // Map mouse position to rotation
      const targetRotationX = (mousePosition.y - 0.5) * 0.4; // Pitch
      const targetRotationY = (mousePosition.x - 0.5) * 0.6; // Yaw
      
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetRotationX, 0.1);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetRotationY, 0.1);
    }
    
    if (neck) {
        const targetRotationY = (mousePosition.x - 0.5) * 0.3;
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetRotationY, 0.05);
    }

    // Expressions / Morph Targets
    const targetExpression = EXPRESSIONS[expression] || EXPRESSIONS.neutral;
    
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        Object.keys(targetExpression).forEach(key => {
          const index = child.morphTargetDictionary[key];
          if (index !== undefined) {
             child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                child.morphTargetInfluences[index],
                targetExpression[key],
                0.05
             );
          }
        });
      }
    });

  });

  return (
    <group ref={group} dispose={null} scale={1.2} position={[0, -1.8, 0]}>
      <primitive object={scene} />
    </group>
  );
};

export default DoctorModel;

// Preload the model
useGLTF.preload('/medico.glb');
