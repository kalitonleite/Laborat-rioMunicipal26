
import React, { useState, useEffect, useRef } from 'react';
import { Bot, User as UserIcon, Stethoscope, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeechBubble from './SpeechBubble';
import ChatDrawer from './ChatDrawer';
import Doctor3D from './Doctor3D';
import './doctor-ai.css';
import { User } from '../../types';
import gsap from 'gsap';

interface DoctorAIProps {
  user?: User | null;
}

const DoctorAI: React.FC<DoctorAIProps> = ({ user }) => {
  const userName = user?.name || 'Visitante';
  const [chatOpen, setChatOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(
    `Bem-vindo! Precisa de ajuda para navegar no portal?`
  );
  const [expression, setExpression] = useState('neutral');
  const [animation, setAnimation] = useState('idle');
  const [isFocused, setIsFocused] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial entrance animation disabled for debugging
    if (containerRef.current) {
        gsap.from(containerRef.current, {
            y: 400,
            opacity: 0,
            duration: 1.5,
            ease: 'power3.out'
        });
    }
    console.log("DoctorAI mounted for user:", user?.name);

    // Auto-hide welcome bubble after 10 seconds
    const timer = setTimeout(() => {
      if (!chatOpen) setBubbleMessage(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleAIStartThinking = () => {
    setIsThinking(true);
    setExpression('thinking');
    setAnimation('thinking');
    setBubbleMessage(null);
  };

  const handleAIStopThinking = (reply: string) => {
    setIsThinking(false);
    setExpression('happy');
    setAnimation('talking');
    
    // Summary for bubble if reply is too long
    const summary = reply.length > 100 ? reply.substring(0, 97) + '...' : reply;
    setBubbleMessage(summary);
    
    // Return to idle after a while
    setTimeout(() => {
        setAnimation('idle');
        setExpression('neutral');
    }, 5000);
  };

  const handleClickDoctor = () => {
    if (chatOpen) return;
    
    setChatOpen(true);
    setIsFocused(true);
    setExpression('happy');
    setAnimation('pointing');

    // walk_to_element / move forward logic
    if (containerRef.current) {
        gsap.to(containerRef.current, {
            x: -50,
            scale: 1.05,
            duration: 0.8,
            ease: 'power2.out'
        });
    }

    setTimeout(() => {
        setAnimation('idle');
    }, 2000);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setIsFocused(false);
    
    // return_to_corner logic
    if (containerRef.current) {
        gsap.to(containerRef.current, {
            x: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.inOut'
        });
    }
  };

  return (
    <div ref={containerRef} className="doctor-ai-container fixed bottom-0 right-0 z-[1000]">
      {/* Speech Bubble */}
      <SpeechBubble 
        message={bubbleMessage} 
        isThinking={isThinking} 
        onBubbleClick={handleClickDoctor}
      />

      {/* Doctor AI Avatar Placeholder/Icon */}
      <div 
        className="doctor-ai-canvas-wrapper flex items-end justify-end p-6"
        onClick={handleClickDoctor}
      >
        <div className="relative w-full h-full">
          <Doctor3D 
            expression={expression} 
            animation={animation} 
            isFocused={isFocused} 
          />
          
          {/* Label */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-xl border border-white/20 z-10">
             ASSISTENTE VIRTUAL
          </div>
        </div>
      </div>

      {/* Interaction Modal / Drawer */}
      <ChatDrawer 
        isOpen={chatOpen} 
        onClose={handleCloseChat}
        userId={user?.id || 'visitor'}
        userName={userName}
        onAIStartThinking={handleAIStartThinking}
        onAIStopThinking={handleAIStopThinking}
      />
    </div>
  );
};

export default DoctorAI;
