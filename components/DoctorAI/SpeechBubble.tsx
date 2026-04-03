
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
  message: string | null;
  isThinking: boolean;
  onBubbleClick: () => void;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ message, isThinking, onBubbleClick }) => {
  return (
    <AnimatePresence>
      {(message || isThinking) && (
        <motion.div
          className="doctor-bubble-wrapper"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <div 
            className="speech-bubble cursor-pointer select-none"
            onClick={onBubbleClick}
          >
            {isThinking ? (
              <div className="flex items-center gap-2">
                <span className="ai-status-dot thinking"></span>
                <span className="italic text-gray-500">Dr. IA está analisando seus dados...</span>
              </div>
            ) : (
              <p>{message}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechBubble;
