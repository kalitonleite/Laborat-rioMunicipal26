
import React, { useState, useEffect, useRef } from 'react';
import Doctor3D from './Doctor3D';
import SpeechBubble from './SpeechBubble';
import ChatDrawer from './ChatDrawer';
import './doctor-ai.css';
import { User } from '../../types';
import gsap from 'gsap';

interface DoctorAIProps {
  user: User;
}

const DoctorAI: React.FC<DoctorAIProps> = ({ user }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(
    `Olá ${user.name}! Posso te ajudar com seus exames?`
  );
  const [expression, setExpression] = useState('neutral');
  const [animation, setAnimation] = useState('idle');
  const [isFocused, setIsFocused] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial entrance animation
    if (containerRef.current) {
        gsap.from(containerRef.current, {
            y: 400,
            opacity: 0,
            duration: 1.5,
            ease: 'power3.out'
        });
    }

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

      {/* 3D Model Area */}
      <div 
        className="doctor-ai-canvas-wrapper"
        onClick={handleClickDoctor}
      >
        <Doctor3D 
          expression={expression} 
          animation={animation} 
          isFocused={chatOpen} 
        />
      </div>

      {/* Interaction Modal / Drawer */}
      <ChatDrawer 
        isOpen={chatOpen} 
        onClose={handleCloseChat}
        userId={user.id}
        userName={user.name}
        onAIStartThinking={handleAIStartThinking}
        onAIStopThinking={handleAIStopThinking}
      />
    </div>
  );
};

export default DoctorAI;
