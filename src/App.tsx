import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Sun, 
  Settings as SettingsIcon, 
  Bell,
  ShieldAlert,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Loader2,
  Bluetooth,
  Wind,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { GliderGame } from './components/GliderGame';
import { Settings } from './components/Settings';
import { AICoach } from './components/AICoach';
import { LoginPage } from './components/LoginPage';
import { Notifications } from './components/Notifications';
import { AnxietyDataPoint } from './types';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'schedule' | 'coach' | 'settings' | 'notifications';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function App() {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('aura_user_name'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('aura_user_name'));
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Default to false for freemium experience
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showGlider, setShowGlider] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('glider');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(300);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aura_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isLoggedIn && userName) {
      const checkPremium = async () => {
        try {
          const res = await fetch(`/api/premium-status/${userName}`);
          const data = await res.json();
          setIsPremium(data.isPremium);
        } catch (e) {
          console.error("Error checking premium status", e);
        }
      };
      
      checkPremium();
      // Refresh status every minute in case they just paid
      const interval = setInterval(checkPremium, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, userName]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aura_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('aura_last_greeting_date');
    if (lastDate !== today && activeTab === 'dashboard' && isLoggedIn) {
      setShowGreeting(true);
      localStorage.setItem('aura_last_greeting_date', today);
    }
  }, [activeTab, isLoggedIn]);

  useEffect(() => {
    const saved = localStorage.getItem('aura_notifications');
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('aura_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Notification logic: Check schedule every minute
  useEffect(() => {
    const checkSchedule = () => {
      const savedSchedules = localStorage.getItem('aura_schedules');
      if (!savedSchedules) return;

      const items = JSON.parse(savedSchedules);
      const now = new Date();

      items.forEach((item: any) => {
        if (item.isCompleted) return;

        // Parse start time (e.g., "09:00 AM")
        const [time, period] = item.startTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let h = hours;
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;

        // Parse date (YYYY-MM-DD) and set time in local timezone
        const [year, month, day] = item.date.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day, h, minutes, 0, 0);

        // Check if event is within the next hour (and not already notified)
        const diffMs = eventDate.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // Notify if event is between 0 and 60 minutes away
        if (diffMins > 0 && diffMins <= 60) {
          const notificationId = `notif_${item.id}`;
          
          setNotifications(prev => {
            const alreadyNotified = prev.some(n => n.id === notificationId);
            if (alreadyNotified) return prev;

            const newNotif = {
              id: notificationId,
              title: `${item.title} at ${item.startTime}`,
              message: item.stressPlan || "Take a moment to breathe before your next event.",
              timestamp: Date.now(),
              read: false,
              eventId: item.id,
              recommendedExercise: item.recommendedExercise
            };
            return [newNotif, ...prev];
          });
        }
      });
    };

    const interval = setInterval(checkSchedule, 60000); // Check every minute
    checkSchedule(); // Initial check
    return () => clearInterval(interval);
  }, []); // Remove notifications dependency to avoid unnecessary re-runs, functional update handles it

  const handleLogin = (name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    localStorage.setItem('aura_user_name', name);
  };

  const handleLogout = async () => {
    setUserName(null);
    setIsLoggedIn(false);
    localStorage.removeItem('aura_user_name');
  };

  const handleSessionComplete = (averageHarmony: number) => {
    setShowGlider(false);
    setSelectedTechniqueId(undefined);
    
    // Calculate anxiety level: high harmony (100) = low anxiety (0)
    // We use a slight adjustment to make it feel more "real"
    const anxietyLevel = Math.max(0, Math.min(100, 100 - averageHarmony));
    
    const newPoint: AnxietyDataPoint = {
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      level: Math.round(anxietyLevel),
      heartRate: 72, // Baseline HR
      adjustedLevel: Math.round(anxietyLevel),
      timestamp: Date.now(),
      hour: new Date().getHours()
    };

    const savedLogs = localStorage.getItem('aura_anxiety_logs');
    const logs = savedLogs ? JSON.parse(savedLogs) : [];
    const updatedLogs = [...logs, newPoint].slice(-96); // Keep last 24h
    localStorage.setItem('aura_anxiety_logs', JSON.stringify(updatedLogs));
    
    // Switch to dashboard to show the new data point
    setActiveTab('dashboard');
  };

  const handleUpgrade = async () => {
    window.open(`https://buy.stripe.com/14AdR20zhd65aJ8eEPaEE01?client_reference_id=${userName}`, '_blank');
  };

  // Debug state changes
  useEffect(() => {
    console.log('App State Update:', { showGlider, selectedGame, showDurationPicker, selectedDuration });
  }, [showGlider, selectedGame, showDurationPicker, selectedDuration]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-sky-100 transition-colors duration-300 flex flex-col">
      {/* Sidebar / Desktop Nav */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border hidden lg:flex flex-col p-8 z-30">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-foreground">AuraGlider</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<CalendarIcon />} 
            label="Calendar" 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')} 
          />
          <NavItem 
            icon={<Sun />} 
            label="Aura AI" 
            active={activeTab === 'coach'} 
            onClick={() => setActiveTab('coach')} 
          />
          <NavItem 
            icon={<Bell />} 
            label="Notifications" 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')} 
            badge={notifications.filter(n => !n.read).length > 0 ? String(notifications.filter(n => !n.read).length) : undefined}
          />
          <NavItem 
            icon={<SettingsIcon />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="mt-auto space-y-4">
          {!isPremium && (
            <button 
              onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] font-bold hover:opacity-90 transition-all shadow-xl shadow-indigo-100 dark:shadow-none group"
            >
              <Sun className="w-5 h-5 group-hover:animate-pulse" />
              Upgrade to Premium
            </button>
          )}
          
          <button 
            onClick={() => {
              setSelectedGame('glider');
              setShowDurationPicker(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-4 bg-sky-600 text-white cloud-shape font-bold hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 dark:shadow-none mt-4"
          >
            <Wind className="w-5 h-5" />
            GLIDE
          </button>
          
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Crisis Support</p>
            <p className="text-[10px] text-rose-700 mb-3">Need immediate help? Talk to someone now.</p>
            <button className="w-full py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors">
              Get Help
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-40 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2">
          <Wind className="w-6 h-6 text-sky-500" />
          <span className="font-black text-xl text-foreground">AuraGlider</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 text-foreground/60 hover:text-sky-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-card" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <main className="lg:ml-72 p-4 sm:p-6 lg:p-12 pb-32 lg:pb-12 max-w-6xl mx-auto">
          <header className="mb-6 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <AnimatePresence mode="wait">
              {activeTab !== 'dashboard' && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 text-slate-400 hover:text-sky-500 transition-colors text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-3 sm:mb-6 group"
                >
                  <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-sky-50 transition-colors">
                    <ChevronLeft className="w-3 h-3" />
                  </div>
                  <span>Back to Dashboard</span>
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {activeTab === 'dashboard' && showGreeting && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sky-500 font-bold text-[10px] sm:text-sm uppercase tracking-widest"
                >
                  <Sun className="w-4 h-4" />
                  <span>{getGreeting()}, {userName}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
                  {activeTab === 'dashboard' ? "" : 
                   activeTab === 'schedule' ? "Plan Your Calm" : 
                   activeTab === 'coach' ? "Aura Coach" : 
                   activeTab === 'notifications' ? "Aura Alerts" : "Settings"}
                </h2>
              </div>
              
              {activeTab === 'dashboard' && (
                <div className="flex-1 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedGame('glider');
                      setShowDurationPicker(true);
                    }}
                    className="px-6 sm:px-10 py-3 sm:py-4 bg-sky-500 text-white cloud-shape font-black text-[10px] sm:text-sm uppercase tracking-widest shadow-2xl shadow-sky-100 hover:bg-sky-600 transition-all flex items-center gap-3"
                  >
                    <Wind className="w-5 h-5" />
                    GLIDE
                  </motion.button>
                </div>
              )}
              
              <div className="flex-1 hidden md:block" />
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'dashboard' && (
            <Dashboard 
              onStartSession={() => {
                setSelectedGame('glider');
                setShowDurationPicker(true);
              }} 
              onNavigateToSchedule={() => setActiveTab('schedule')}
            />
          )}
          {activeTab === 'schedule' && (
            <Schedule 
              initialEventId={selectedEventId} 
              onClearInitialEvent={() => setSelectedEventId(null)} 
              onStartExercise={(type, duration) => {
                if (type === 'breathing') {
                  setSelectedGame('glider');
                  setSelectedTechniqueId(undefined);
                  setShowDurationPicker(true);
                } else {
                  setSelectedGame('glider');
                  setSelectedTechniqueId(type);
                  if (duration) {
                    setSelectedDuration(duration);
                    setShowGlider(true);
                  } else {
                    setShowDurationPicker(true);
                  }
                }
              }}
            />
          )}
          {activeTab === 'notifications' && (
            <Notifications 
              notifications={notifications} 
              onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
              onClear={() => setNotifications([])}
              onAction={(eventId) => {
                if (eventId) {
                  setSelectedEventId(eventId);
                  setActiveTab('schedule');
                }
              }}
              onStartExercise={(type, duration) => {
                if (type === 'breathing') {
                  setSelectedGame('glider');
                  setSelectedTechniqueId(undefined);
                  setShowDurationPicker(true);
                } else {
                  setSelectedGame('glider');
                  setSelectedTechniqueId(type);
                  if (duration) {
                    setSelectedDuration(duration);
                    setShowGlider(true);
                  } else {
                    setShowDurationPicker(true);
                  }
                }
              }}
            />
          )}
          {activeTab === 'coach' && (
            <div className="space-y-12">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <AICoach 
                    isPremium={isPremium}
                    userName={userName || undefined}
                    onStartSession={(d, techId) => {
                      setSelectedDuration(d);
                      setSelectedTechniqueId(techId);
                      setSelectedGame('glider');
                      setShowGlider(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <Settings 
              userName={userName} 
              onLogout={handleLogout} 
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            />
          )}
        </motion.div>
      </main>
    </div>

      {/* iOS Style Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom)] h-[calc(64px+env(safe-area-inset-bottom))] z-40">
        <MobileNavItem 
          icon={<LayoutDashboard />} 
          label="Home" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <MobileNavItem 
          icon={<CalendarIcon />} 
          label="Plan" 
          active={activeTab === 'schedule'} 
          onClick={() => setActiveTab('schedule')} 
        />
        <div className="relative -top-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSelectedGame('glider');
              setShowDurationPicker(true);
            }}
            className="w-14 h-14 bg-sky-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-sky-200 border-4 border-card"
          >
            <Wind className="w-7 h-7" />
          </motion.button>
        </div>
        <MobileNavItem 
          icon={<Sun />} 
          label="Coach" 
          active={activeTab === 'coach'} 
          onClick={() => setActiveTab('coach')} 
        />
        <MobileNavItem 
          icon={<SettingsIcon />} 
          label="User" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </nav>

      {/* Duration Picker Overlay */}
      <AnimatePresence>
        {showDurationPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-border"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">Choose Duration</h3>
                <button onClick={() => setShowDurationPicker(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[1, 2, 3, 4, 5, 10].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSelectedDuration(mins * 60)}
                    className={cn(
                      "py-4 rounded-2xl font-bold transition-all border-2",
                      selectedDuration === mins * 60 
                        ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200" 
                        : "bg-card border-border text-foreground hover:border-sky-200"
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('Launching Sanctuary:', { game: 'glider', duration: selectedDuration });
                  setShowDurationPicker(false);
                  setSelectedGame('glider');
                  setShowGlider(true);
                }}
                className="w-[80%] mx-auto py-4 bg-sky-500 text-white cloud-shape font-black text-xl shadow-2xl shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-3 group"
              >
                <Wind className="w-6 h-6 group-hover:animate-pulse" />
                GLIDE
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Sanctuary Overlay */}
      <AnimatePresence>
        {showGlider && (
          <GliderGame 
            duration={selectedDuration}
            initialTechniqueId={selectedTechniqueId}
            onComplete={handleSessionComplete} 
            onCancel={() => {
              setShowGlider(false);
              setSelectedTechniqueId(undefined);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavItem({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-1 transition-all",
        active ? "text-sky-500" : "text-slate-400"
      )}
    >
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "scale-100")}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  onClick, 
  badge, 
  disabled, 
  premiumLink 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  badge?: string,
  disabled?: boolean,
  premiumLink?: string
}) {
  return (
    <div className="flex items-center gap-2 group/nav">
      <button 
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          "flex-1 flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all relative",
          active 
            ? "bg-sky-50 text-sky-600 shadow-sm" 
            : disabled 
              ? "text-slate-300 cursor-not-allowed opacity-60" 
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        )}
      >
        <span className={cn("transition-colors", active ? "text-sky-500" : disabled ? "text-slate-200" : "text-slate-300")}>
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
        </span>
        <span className="flex-1 text-left">{label}</span>
        {badge && (
          <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md tracking-widest">
            {badge}
          </span>
        )}
      </button>
      {disabled && premiumLink && (
        <a 
          href={premiumLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-orange-100 hover:scale-105 transition-all uppercase tracking-wider flex items-center gap-1"
        >
          <Sun className="w-3 h-3" />
          Premium
        </a>
      )}
    </div>
  );
}
