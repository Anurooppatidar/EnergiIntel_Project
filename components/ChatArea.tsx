
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, User, Bot, Loader2, Info } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  hasDocs: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, isProcessing, hasDocs }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col relative bg-slate-950">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Energy Intelligence Assistant</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Upload your technical reports, environmental studies, or plant manuals. I'll help you find answers buried deep in your documents.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {[
                "Summarize the technical specs of the turbine.",
                "What are the grid safety requirements mentioned?",
                "Compare energy yield forecasts between documents.",
                "Find any mentions of carbon emission targets."
              ].map((hint, i) => (
                <button 
                  key={i}
                  disabled={!hasDocs}
                  onClick={() => onSendMessage(hint)}
                  className="p-3 text-sm text-left bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hint}
                </button>
              ))}
            </div>
            {!hasDocs && (
              <div className="mt-6 flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg">
                <Info className="w-3 h-3" />
                Upload documents to enable interrogation
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white' 
                  : msg.content.includes('Connection Error') 
                    ? 'bg-red-500/10 border border-red-500/30 text-red-100' 
                    : 'bg-slate-900 border border-slate-800 text-slate-100'
              }`}>
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Grounded Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, i) => (
                        <span key={i} className="text-[9px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex gap-4 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
            <div className="max-w-[100px] h-10 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gradient-to-t from-slate-950 to-transparent">
        <form 
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasDocs || isProcessing}
            placeholder={hasDocs ? "Ask about your energy documents..." : "Upload documents to start chatting"}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isProcessing || !hasDocs}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-lg shadow-emerald-500/10"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
