
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Bot, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onAIStartThinking: () => void;
  onAIStopThinking: (reply: string) => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ 
  isOpen, onClose, userId, userName, onAIStartThinking, onAIStopThinking 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Olá ${userName}, sou o Dr. IA do Laboratório Municipal de Uarini. Em que posso ajudar hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    onAIStartThinking();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId,
          history: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        onAIStopThinking(data.reply);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Chat Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, estou com dificuldades técnicas agora. Tente novamente em instantes.' }]);
      onAIStopThinking('Erro na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[990]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="chat-drawer"
          >
            <div className="chat-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 border border-blue-200">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-blue-900 text-sm">DR. IA</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="ai-status-dot"></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Close Chat"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="chat-messages no-scrollbar" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`message ${m.role === 'user' ? 'user' : 'ai'}`}>
                  {m.role === 'assistant' && (
                    <div className="mb-2 opacity-50 flex items-center gap-1">
                      <Bot size={12} />
                      <span className="text-[10px] font-bold">DR. IA</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {loading && (
                <div className="message ai flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-900" />
                  <span className="italic">Dr. IA está pensando...</span>
                </div>
              )}
            </div>

            <div className="chat-input-area">
              <div className="chat-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Olá Dr. IA, meus exames estão normais?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="chat-input"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="send-btn"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 text-center">
                Respostas automáticas do sistema baseadas em IA. 
                <br/><b>Sempre consulte seu médico.</b>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;
