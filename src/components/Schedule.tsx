import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  X,
  Mic,
  Sun as SunIcon,
  Loader2,
  Edit2,
  Trash2,
  Check,
  MoreVertical,
  ShieldAlert,
  Wind,
  RefreshCw
} from 'lucide-react';
import { AuraIcon } from './AuraIcon';
import { offlineAI } from '../services/aiService';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  addDays,
  parse,
  isToday
} from 'date-fns';
import { ScheduleItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleProps {
  initialEventId?: string | null;
  onClearInitialEvent?: () => void;
  onStartExercise?: (exerciseType: string, duration?: number) => void;
}

const TimePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  // Parse "09:00 AM" or fallback
  const parts = value.split(' ');
  const timePart = parts[0] || '09:00';
  const periodPart = parts[1] || 'AM';
  const [h, m] = timePart.split(':');

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const periods = ['AM', 'PM'];

  const update = (newH: string, newM: string, newP: string) => {
    onChange(`${newH}:${newM} ${newP}`);
  };

  return (
    <div className="flex items-center justify-center bg-muted/30 rounded-[2rem] p-4 border border-border/50">
      <div className="flex gap-4 h-32">
        {/* Hours */}
        <div className="flex flex-col overflow-y-auto scrollbar-hide snap-y snap-mandatory w-12 text-center">
          <div className="h-12 shrink-0" />
          {hours.map(hour => (
            <button
              key={hour}
              onClick={() => update(hour, m, periodPart)}
              className={cn(
                "h-8 flex items-center justify-center shrink-0 snap-center text-sm font-black transition-all",
                h === hour ? "text-sky-500 scale-125" : "text-muted-foreground/30 hover:text-muted-foreground"
              )}
            >
              {hour}
            </button>
          ))}
          <div className="h-12 shrink-0" />
        </div>

        <div className="flex items-center text-muted-foreground/20 font-black">:</div>

        {/* Minutes */}
        <div className="flex flex-col overflow-y-auto scrollbar-hide snap-y snap-mandatory w-12 text-center">
          <div className="h-12 shrink-0" />
          {minutes.map(minute => (
            <button
              key={minute}
              onClick={() => update(h, minute, periodPart)}
              className={cn(
                "h-8 flex items-center justify-center shrink-0 snap-center text-sm font-black transition-all",
                m === minute ? "text-sky-500 scale-125" : "text-muted-foreground/30 hover:text-muted-foreground"
              )}
            >
              {minute}
            </button>
          ))}
          <div className="h-12 shrink-0" />
        </div>

        {/* Period */}
        <div className="flex flex-col overflow-y-auto scrollbar-hide snap-y snap-mandatory w-12 text-center">
          <div className="h-12 shrink-0" />
          {periods.map(period => (
            <button
              key={period}
              onClick={() => update(h, m, period)}
              className={cn(
                "h-8 flex items-center justify-center shrink-0 snap-center text-[10px] font-black transition-all",
                periodPart === period ? "text-sky-500 scale-125" : "text-muted-foreground/30 hover:text-muted-foreground"
              )}
            >
              {period}
            </button>
          ))}
          <div className="h-12 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export const Schedule: React.FC<ScheduleProps> = ({ initialEventId, onClearInitialEvent, onStartExercise }) => {
  const [view, setView] = useState<'calendar' | 'stress-plan'>('calendar');

  useEffect(() => {
    if (initialEventId) {
      setView('stress-plan');
      if (onClearInitialEvent) onClearInitialEvent();
    }
  }, [initialEventId, onClearInitialEvent]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedules = () => {
      const saved = localStorage.getItem('aura_schedules');
      if (saved) {
        const loadedItems: ScheduleItem[] = JSON.parse(saved);
        setItems(loadedItems);

        // Check for items missing stress plans and generate them
        loadedItems.forEach(item => {
          if (!item.stressPlan && !item.isCompleted) {
            offlineAI.generateStressPlan(item.title, item.expectedStress).then(result => {
              setItems(prev => {
                const alreadyHasPlan = prev.find(i => i.id === item.id)?.stressPlan;
                if (alreadyHasPlan) return prev;
                
                const updated = prev.map(i => i.id === item.id ? { 
                  ...i, 
                  stressPlan: result.plan,
                  recommendedExercise: result.recommendedExercise,
                  recommendedDuration: result.duration
                } : i);
                localStorage.setItem('aura_schedules', JSON.stringify(updated));
                return updated;
              });
            });
          }
        });
      }
    };
    loadSchedules();
  }, []);

  const saveSchedules = (newItems: ScheduleItem[]) => {
    setItems(newItems);
    localStorage.setItem('aura_schedules', JSON.stringify(newItems));
  };

  // Compute daily stress from schedule
  const dailyStressMap = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Group items by date
    const grouped = items.reduce((acc, item) => {
      const dateKey = item.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item.expectedStress);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate max stress for each day
    (Object.entries(grouped) as [string, number[]][]).forEach(([date, levels]) => {
      const max = Math.max(...levels);
      map[date] = max;
    });

    return map;
  }, [items]);

  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', startTime: '09:00 AM', expectedStress: 5, description: '' });

  const addItem = async () => {
    if (!newItem.title.trim()) {
      setError("Please enter an event title");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      const item: ScheduleItem = {
        id: Math.random().toString(36).substr(2, 9),
        title: newItem.title.trim(),
        description: newItem.description,
        startTime: newItem.startTime || '12:00 PM',
        endTime: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        expectedStress: newItem.expectedStress,
        isCompleted: false,
      };

      // Generate stress plan in background
      offlineAI.generateStressPlan(item.title, item.expectedStress).then(result => {
        setItems(prev => {
          const updated = prev.map(i => i.id === item.id ? { 
            ...i, 
            stressPlan: result.plan,
            recommendedExercise: result.recommendedExercise,
            recommendedDuration: result.duration
          } : i);
          localStorage.setItem('aura_schedules', JSON.stringify(updated));
          return updated;
        });
      });

      saveSchedules([...items, item]);
      setNewItem({ title: '', startTime: '09:00 AM', expectedStress: 5, description: '' });
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = async () => {
    if (!editingItem) return;
    if (!editingItem.title.trim()) {
      setError("Title cannot be empty");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const newItems = items.map(i => i.id === editingItem.id ? { ...editingItem, title: editingItem.title.trim() } : i);
      saveSchedules(newItems);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const newItems = items.filter(i => i.id !== id);
      saveSchedules(newItems);
      if (editingItem?.id === id) setEditingItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    const newItems = items.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i);
    saveSchedules(newItems);
  };

  const clearAllStressPlans = () => {
    const newItems = items.map(i => ({ ...i, isCompleted: true }));
    saveSchedules(newItems);
  };

  const restoreAllStressPlans = () => {
    const newItems = items.map(i => ({ ...i, isCompleted: false }));
    saveSchedules(newItems);
  };

  const handleAiSchedule = async () => {
    if (!aiInput.trim()) {
      setError("Please enter what you'd like to schedule");
      return;
    }

    setIsAiLoading(true);
    setError(null);

    try {
      // Simple local parser for offline mode
      const title = aiInput.trim();
      const item: ScheduleItem = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description: 'Scheduled via quick entry',
        startTime: '12:00 PM',
        endTime: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        expectedStress: 5,
        isCompleted: false,
      };
      
      saveSchedules([...items, item]);
      setAiInput('');
    } catch (error) {
      console.error("Local Scheduler Error:", error);
      setError("An error occurred while scheduling locally.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const selectedDateItems = items
    .filter(item => isSameDay(parseISO(item.date), selectedDate))
    .sort((a, b) => {
      const timeA = parse(a.startTime, 'h:mm a', new Date());
      const timeB = parse(b.startTime, 'h:mm a', new Date());
      return timeA.getTime() - timeB.getTime();
    });

  const getStressColor = (stress: number) => {
    if (stress > 7) return 'bg-rose-500';
    if (stress > 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setView('calendar')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            view === 'calendar' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Calendar
        </button>
        <button 
          onClick={() => setView('stress-plan')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            view === 'stress-plan' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Stress Plan
        </button>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calendar & AI */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* AI Smart Scheduler */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-border overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <SunIcon className="w-32 h-32 text-sky-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sky-50 rounded-xl">
                  <SunIcon className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Quick Scheduler</h3>
                  <p className="text-muted-foreground text-xs">Type to add events to your local schedule</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSchedule()}
                    placeholder="What's on your mind?"
                    className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-muted/50 border-transparent focus:bg-card focus:border-sky-500 focus:ring-0 transition-all text-sm font-medium"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <button 
                  onClick={handleAiSchedule}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="px-6 bg-sky-500 text-white rounded-2xl font-bold text-sm hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-sky-100"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Schedule
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Calendar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-8 rounded-[2.5rem] shadow-sm border border-border"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{format(currentMonth, 'MMMM')}</h3>
                <span className="text-2xl font-light text-muted-foreground/40">{format(currentMonth, 'yyyy')}</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={goToToday}
                  className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition-all"
                >
                  Today
                </button>
                <div className="flex items-center bg-slate-50 p-1 rounded-xl">
                  <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-card hover:shadow-sm rounded-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-card hover:shadow-sm rounded-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
              {calendarDays.map((day, idx) => {
                const dayEvents = items.filter(item => isSameDay(parseISO(item.date), day));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "group relative aspect-square rounded-3xl flex flex-col items-center justify-center transition-all duration-300",
                      !isCurrentMonth ? "opacity-20" : "opacity-100",
                      isSelected 
                        ? "bg-sky-50 text-sky-600 shadow-xl shadow-sky-100 ring-2 ring-sky-500 ring-inset scale-105 z-10" 
                        : "hover:bg-muted/50 text-foreground",
                      isTodayDate && !isSelected && "ring-2 ring-sky-500 ring-offset-4"
                    )}
                  >
                    <span className={cn(
                      "text-base font-black mb-1",
                      isSelected ? "text-sky-600" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="flex gap-1 mt-1 flex-wrap justify-center px-1">
                      {/* Scheduled Stress Dot */}
                      {dailyStressMap[format(day, 'yyyy-MM-dd')] !== undefined && (
                        <div 
                          className={cn(
                            "w-2 h-2 rounded-full shadow-sm ring-1 ring-white",
                            getStressColor(dailyStressMap[format(day, 'yyyy-MM-dd')])
                          )} 
                          title={`Expected Stress: ${dailyStressMap[format(day, 'yyyy-MM-dd')]}/10`}
                        />
                      )}
                      
                      {/* Scheduled Event Dots */}
                      {dayEvents.slice(0, 2).map((event, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all group-hover:scale-125",
                            getStressColor(event.expectedStress)
                          )} 
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className={cn(
                          "text-[8px] font-bold",
                          isSelected ? "text-sky-400" : "text-muted-foreground"
                        )}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Daily View */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card p-8 rounded-[2.5rem] shadow-sm border border-border min-h-[600px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-xl font-black text-foreground">{format(selectedDate, 'EEEE')}</h4>
                <p className="text-muted-foreground text-xs font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
              </div>
              <button 
                onClick={() => setIsAddingNew(true)}
                className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {selectedDateItems.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Clear schedule for today</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Enjoy your free time!</p>
                  </motion.div>
                ) : (
                  selectedDateItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group relative p-5 rounded-[2rem] border transition-all duration-300",
                        item.isCompleted 
                          ? "bg-slate-50 border-slate-100 opacity-60" 
                          : "bg-card border-border hover:border-sky-200 dark:hover:shadow-none"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => toggleComplete(item.id)}
                          className={cn(
                            "mt-1 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all",
                            item.isCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-200 hover:border-sky-500"
                          )}
                        >
                          {item.isCompleted && <Check className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className={cn(
                              "text-sm font-black truncate",
                              item.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                            )}>
                              {item.title}
                            </h5>
                            {item.expectedStress > 7 && !item.isCompleted && (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.startTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={cn("w-1.5 h-1.5 rounded-full", getStressColor(item.expectedStress))} />
                              Stress: {item.expectedStress}/10
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="p-2 hover:bg-sky-50 text-muted-foreground/40 hover:text-sky-600 rounded-xl transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-2 hover:bg-rose-50 text-muted-foreground/40 hover:text-rose-500 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Proactive Intervention Card */}
            <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black">Daily Insight</h3>
                  <p className="text-white/60 text-[10px] leading-relaxed">
                    You have {selectedDateItems.filter(i => i.expectedStress > 7).length} high-stress events today. 
                    We've optimized your breathing sessions accordingly.
                  </p>
                </div>
                <div className="p-2 bg-white/10 rounded-xl">
                  <SunIcon className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <button 
                onClick={() => setView('stress-plan')}
                className="w-full py-3 bg-sky-500 text-white text-xs font-black rounded-2xl hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
              >
                View Stress Plan
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-foreground">Active Stress Plans</h3>
            <div className="flex items-center gap-3">
              {items.filter(i => i.isCompleted).length > 0 && (
                <button 
                  onClick={restoreAllStressPlans}
                  className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restore All
                </button>
              )}
              {items.filter(i => !i.isCompleted).length > 0 && (
                <button 
                  onClick={clearAllStressPlans}
                  className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.filter(i => !i.isCompleted).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:shadow-sky-50 transition-all group relative"
              >
                <button 
                  onClick={() => toggleComplete(item.id)}
                  className="absolute top-6 right-6 p-2 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Close Plan"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-start justify-between mb-6 pr-8">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    item.expectedStress > 7 ? "bg-rose-50 text-rose-500" : 
                    item.expectedStress > 4 ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                  )}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{format(parseISO(item.date), 'MMM d')}</p>
                    <p className="text-xs font-bold text-foreground">{item.startTime}</p>
                  </div>
                </div>

                <h4 className="text-lg font-black text-foreground mb-2 truncate">{item.title}</h4>
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", getStressColor(item.expectedStress))}
                      style={{ width: `${item.expectedStress * 10}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{item.expectedStress}/10</span>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <SunIcon className="w-12 h-12 text-sky-600" />
                  </div>
                  <h5 className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AuraIcon className="w-3 h-3" />
                    Resilience Strategy
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed relative z-10 mb-4">
                    {item.stressPlan || "Generating your personalized resilience strategy..."}
                  </p>
                  {item.recommendedExercise && onStartExercise && (
                    <button 
                      onClick={() => onStartExercise(item.recommendedExercise!, item.recommendedDuration)}
                      className="w-full py-2.5 bg-sky-500 text-white text-[10px] font-black cloud-shape hover:bg-sky-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Wind className="w-3 h-3" />
                      Start "{item.recommendedExercise.replace('-', ' ')}"
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {items.filter(i => !i.isCompleted).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-[3rem] border border-border">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/20" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">No Active Stress Plans</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Add events to your schedule to see personalized resilience strategies.</p>
            </div>
          )}

          {/* Recently Closed Section */}
          {items.filter(i => i.isCompleted).length > 0 && (
            <div className="pt-12 border-t border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-slate-100" />
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Recently Closed</h4>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.filter(i => i.isCompleted).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    whileHover={{ opacity: 1 }}
                    className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-tighter truncate">{item.title}</p>
                      <p className="text-[9px] font-bold text-slate-300">{format(parseISO(item.date), 'MMM d')}</p>
                    </div>
                    <button 
                      onClick={() => toggleComplete(item.id)}
                      className="p-2.5 bg-white text-emerald-500 rounded-xl shadow-sm border border-slate-100 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Restore Plan"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Modal Overlay */}
      <AnimatePresence>
        {(isAddingNew || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddingNew(false); setEditingItem(null); }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-10 my-8 sm:my-0"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-foreground">
                  {isAddingNew ? 'Add Event' : 'Edit Event'}
                </h3>
                <button 
                  onClick={() => { setIsAddingNew(false); setEditingItem(null); }}
                  className="p-3 hover:bg-muted rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Event Title</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={isAddingNew ? newItem.title : editingItem?.title}
                    onChange={(e) => isAddingNew 
                      ? setNewItem({ ...newItem, title: e.target.value })
                      : setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)
                    }
                    placeholder="What's happening?"
                    className="w-full px-6 py-4 rounded-2xl bg-muted/50 border-transparent focus:bg-card focus:border-sky-500 focus:ring-0 transition-all text-sm font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Start Time</label>
                  <TimePicker 
                    value={isAddingNew ? newItem.startTime : (editingItem?.startTime || '09:00 AM')}
                    onChange={(val) => isAddingNew 
                      ? setNewItem({ ...newItem, startTime: val })
                      : setEditingItem(prev => prev ? { ...prev, startTime: val } : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Expected Stress</label>
                  <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-muted/50">
                    <input 
                      type="range" 
                      min="1" 
                      max="10"
                      value={isAddingNew ? newItem.expectedStress : editingItem?.expectedStress}
                      onChange={(e) => isAddingNew 
                        ? setNewItem({ ...newItem, expectedStress: parseInt(e.target.value) })
                        : setEditingItem(prev => prev ? { ...prev, expectedStress: parseInt(e.target.value) } : null)
                      }
                      className="flex-1 accent-sky-500"
                    />
                    <span className="text-sm font-black text-foreground min-w-[1.5rem]">{isAddingNew ? newItem.expectedStress : editingItem?.expectedStress}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Description (Optional)</label>
                  <textarea 
                    value={isAddingNew ? newItem.description : editingItem?.description}
                    onChange={(e) => isAddingNew 
                      ? setNewItem({ ...newItem, description: e.target.value })
                      : setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)
                    }
                    placeholder="Add some notes..."
                    rows={3}
                    className="w-full px-6 py-4 rounded-2xl bg-muted/50 border-transparent focus:bg-card focus:border-sky-500 focus:ring-0 transition-all text-sm font-medium resize-none"
                  />
                </div>

                <button 
                  onClick={isAddingNew ? addItem : updateItem}
                  disabled={isSaving}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isAddingNew ? (isSaving ? 'Creating...' : 'Create Event') : (isSaving ? 'Saving...' : 'Save Changes')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
