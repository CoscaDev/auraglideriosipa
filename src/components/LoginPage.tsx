import React, { useState, useEffect } from 'react';
import { ArrowRight, Fingerprint, LogIn, Wind } from 'lucide-react';
import { motion } from 'motion/react';
import { WebAuthnService } from '../services/WebAuthnService';

interface LoginPageProps {
  onLogin: (name: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await WebAuthnService.isSupported();
      setIsBiometricSupported(supported);
      setHasCredential(WebAuthnService.hasCredential());
    };
    checkSupport();
  }, []);

  const handleBiometricLogin = async () => {
    const userName = await WebAuthnService.authenticate();
    if (userName) {
      onLogin(userName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card p-12 rounded-[3rem] shadow-2xl border border-border text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-sky-500 rounded-3xl flex items-center justify-center shadow-lg shadow-sky-200">
            <Wind className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-foreground">Welcome to AuraGlider</h1>
          <p className="text-muted-foreground font-medium">Your personal sanctuary for calm.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-left">
            <label htmlFor="name" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Enter your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-bold text-foreground"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-5 bg-slate-900 dark:bg-black text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 dark:shadow-none hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 group"
          >
            Start Your Journey
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {isBiometricSupported && hasCredential && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Or login with</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>
            
            <button
              onClick={handleBiometricLogin}
              className="w-full py-4 bg-card border-2 border-border text-muted-foreground rounded-2xl font-bold hover:border-sky-200 hover:bg-sky-50/30 transition-all flex items-center justify-center gap-3 group"
            >
              <Fingerprint className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
              Biometric Unlock
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Fully Offline • Private • Secure
        </p>
      </motion.div>
    </div>
  );
};
