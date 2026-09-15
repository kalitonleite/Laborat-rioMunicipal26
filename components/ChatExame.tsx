
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatExameProps {
  exameSelecionado: any;
  usuarioId: string;
}

export default function ChatExame({ exameSelecionado, usuarioId }: ChatExameProps) {
  const [messages, setMessages] = useState<Message[]>([]);
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

    try {
      const response = await fetch('/api/chat-exame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta: userMessage,
          exame_id: exameSelecionado?.id,
          usuario_id: usuarioId,
          history: messages
        })
      });

      const rawText = await response.text();
      let data: any = {};
      if (rawText) {
        try { data = JSON.parse(rawText); } catch (e) { data = {}; }
      }
      if (!response.ok) {
        throw new Error(data.error || `Erro do servidor (HTTP ${response.status}).`);
      }
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error(data.error || 'Erro na resposta');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema ao processar sua pergunta. Tente novamente em instantes.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 flex flex-col h-[500px] shadow-sm overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-800 text-base">Assistente Inteligente</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {exameSelecionado ? `Contexto: ${exameSelecionado.exame_nome}` : 'Dúvidas Gerais'}
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <i className="fas fa-robot text-sm"></i>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 px-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-300 text-2xl">
              <i className="fas fa-comment-dots"></i>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Olá! Sou seu assistente de saúde. Selecione um exame ao lado ou me pergunte algo sobre sua saúde 3D.
            </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100' 
                : 'bg-slate-100 text-slate-700 rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo sobre seu exame..."
            className="flex-1 bg-slate-50 border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none p-4 rounded-2xl text-sm font-bold transition-all"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-[9px] text-center text-gray-400 font-bold uppercase mt-3 tracking-widest">
            A IA pode cometer erros. Sempre consulte seu médico.
        </p>
      </div>
    </div>
  );
}
