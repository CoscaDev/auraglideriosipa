import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  User, 
  Moon, 
  Smartphone, 
  ChevronRight,
  LogOut,
  CreditCard,
  Fingerprint,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WebAuthnService } from '../services/WebAuthnService';

interface SettingsProps {
  userName: string | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  userName, 
  onLogout,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [notifications, setNotifications] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await WebAuthnService.isSupported();
      setIsBiometricSupported(supported);
      setHasCredential(WebAuthnService.hasCredential());
    };
    checkSupport();
  }, []);

  const handleRegisterBiometrics = async () => {
    if (!userName) return;
    setIsRegistering(true);
    const success = await WebAuthnService.register(userName);
    if (success) {
      setHasCredential(true);
    }
    setIsRegistering(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-8 rounded-[2.5rem] shadow-sm border border-border">
        <h3 className="text-xl font-bold text-foreground mb-8">Account Settings</h3>
        
        <div className="space-y-6">
          {/* Profile Section */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-3xl">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl overflow-hidden border-2 border-card shadow-sm flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{userName}</h4>
                <p className="text-xs text-muted-foreground">{userName?.toLowerCase().replace(/\s+/g, '.')}@aura.local</p>
              </div>
              <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

          {/* Toggles */}
          <div className="space-y-2">
            <ToggleItem 
              icon={<Bell />} 
              label="Notifications" 
              description="Daily reminders & intervention alerts"
              enabled={notifications}
              onToggle={() => setNotifications(!notifications)}
            />
            <ToggleItem 
              icon={<Moon />} 
              label="Dark Mode" 
              description="Gentle on the eyes for night sessions"
              enabled={isDarkMode}
              onToggle={onToggleDarkMode}
            />
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3 mb-4">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">Medical Disclaimer</p>
                <p className="text-[10px] text-rose-700 leading-relaxed">
                  AuraGlider is a wellness tool and not a replacement for professional medical advice. 
                  Always seek the advice of your physician for medical conditions.
                </p>
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-4 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              Clear Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function ToggleItem({ icon, label, description, enabled, onToggle }: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  enabled: boolean, 
  onToggle: () => void 
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded-xl text-muted-foreground">
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full p-1 transition-all duration-300",
          enabled ? "bg-sky-500" : "bg-muted"
        )}
      >
        <div className={cn(
          "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
          enabled ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}
