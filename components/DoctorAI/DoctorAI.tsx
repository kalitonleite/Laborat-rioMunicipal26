
import React, { useState, useEffect, useRef } from 'react';
import { Bot, User as UserIcon, Stethoscope, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeechBubble from './SpeechBubble';
import ChatDrawer from './ChatDrawer';
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
    /*
    if (containerRef.current) {
        gsap.from(containerRef.current, {
            y: 400,
            opacity: 0,
            duration: 1.5,
            ease: 'power3.out'
        });
    }
    */
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
        <motion.div
          className="relative cursor-pointer group"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="relative bg-white/80 backdrop-blur-xl border-2 border-blue-100 p-4 rounded-full shadow-2xl flex items-center justify-center overflow-hidden w-24 h-24 md:w-32 md:h-32">
             {isThinking ? (
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-12 h-12 text-blue-600" />
                </motion.div>
             ) : (
                <div className="relative">
                   <div className="absolute -top-1 -right-1">
                      <span className="flex h-4 w-4 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                      </span>
                   </div>
                   <Bot className="w-12 h-12 md:w-16 md:h-16 text-blue-800" />
                </div>
             )}
          </div>
          
          {/* Label */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
             DR. IA
          </div>
        </motion.div>
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
