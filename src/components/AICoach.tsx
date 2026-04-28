import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Activity, 
  TrendingUp, 
  Mic,
  Volume2,
  Wind,
  Crown
} from 'lucide-react';
import { AuraIcon } from './AuraIcon';
import { cn } from '../lib/utils';
import { offlineAI } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICoachProps {
  onStartSession?: (duration: number, techId?: string) => void;
  isPremium?: boolean;
  userName?: string;
}

export const AICoach: React.FC<AICoachProps> = ({ onStartSession, isPremium = false, userName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAI = async () => {
      setIsModelLoading(true);
      
      // Gather context for initial greeting
      const name = userName || localStorage.getItem('aura_user_name') || 'there';
      const logs = JSON.parse(localStorage.getItem('aura_anxiety_logs') || '[]');
      const lastLog = logs[logs.length - 1];
      
      let greeting = `Hello ${name}, I'm your Aura Guide. I'm here to help you navigate your stress and find balance. How are you feeling today?`;
      
      if (lastLog) {
        if (lastLog.level > 70) {
          greeting = `Hello ${userName}. I noticed your last session showed quite a bit of tension (Anxiety Level: ${lastLog.level}%). I'm here to help you find some calm. How are you feeling right now?`;
        } else if (lastLog.level < 30) {
          greeting = `Hello ${userName}! Your last session was wonderfully harmonious. It's great to see you in such a balanced state. How can I support your practice today?`;
        }
      }

      setMessages([{
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }]);

      for (let i = 0; i <= 100; i += 20) {
        setLoadingProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }
      setIsModelLoading(false);
    };
    initAI();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(true);

    const userName = localStorage.getItem('aura_user_name');
    const logs = JSON.parse(localStorage.getItem('aura_anxiety_logs') || '[]');
    const context = { userName, logs };

    const lastUserMessage = userMessage.content;
    const response = await offlineAI.generateChatResponse(lastUserMessage, context);
    
    setMessages(prev => prev.map(m => 
      m.id === assistantMessage.id ? { ...m, content: response } : m
    ));
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-[2.5rem] border border-border shadow-xl dark:shadow-none overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-sky-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-lg">Aura Guide</h3>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isModelLoading ? "bg-amber-400" : "bg-emerald-400"
              )} />
              {isLoading ? "Aura Intelligence Analyzing..." : isModelLoading ? `Syncing Intelligence (${loadingProgress}%)...` : "Powered by Aura Intelligence"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(isModelLoading || isLoading) && <Sun className="w-5 h-5 animate-pulse text-white/50" />}
          {!isPremium && (
            <motion.a
              href={`https://buy.stripe.com/14AdR20zhd65aJ8eEPaEE01?client_reference_id=${userName || localStorage.getItem('aura_user_name')}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black rounded-xl shadow-lg border border-white/20 flex items-center gap-2 hover:from-amber-300 hover:to-orange-400 transition-all group"
            >
              <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>GO PREMIUM</span>
            </motion.a>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/30"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-sky-500" : "bg-indigo-500"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm font-medium shadow-sm dark:shadow-none",
                msg.role === 'user' 
                  ? "bg-sky-500 text-white rounded-tr-none" 
                  : "bg-card text-foreground border border-border rounded-tl-none"
              )}>
                {msg.content.split('[EXERCISE:').map((part, i) => {
                  if (i === 0) return part;
                  const [exerciseData, ...rest] = part.split(']');
                  const [techId, durationStr] = exerciseData.split(',').map(s => s.trim());
                  const duration = durationStr ? parseInt(durationStr, 10) : 300;
                  const remainingText = rest.join(']');
                  
                  return (
                    <React.Fragment key={i}>
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <AuraIcon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Recommended Practice</span>
                        </div>
                        <button
                          onClick={() => onStartSession?.(duration, techId)}
                          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          Start {techId.charAt(0).toUpperCase() + techId.slice(1)} Session
                        </button>
                      </div>
                      {remainingText}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="p-4 bg-card rounded-2xl rounded-tl-none border border-border shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-card border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Chat with your guide..."
              className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 dark:text-slate-900"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-500 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3 h-3" />
            Gemini Flash
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Trend Analysis
          </div>
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3 h-3" />
            Voice Guidance
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3 h-3" />
            Breath Harmony
          </div>
        </div>
      </div>
    </div>
  );
};
