import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { AnxietyDataPoint, ScheduleItem } from '../types';
import { Activity, Heart, Sun, TrendingUp, X, Quote, ChevronDown, LogIn, Save, Calendar, History, ZoomIn, ZoomOut } from 'lucide-react';
import { AuraIcon } from './AuraIcon';
import { cn } from '../lib/utils';
import { MORNING_MESSAGES } from '../constants/morningMessages';

interface DashboardProps {
  onStartSession: () => void;
  onNavigateToSchedule?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartSession, onNavigateToSchedule }) => {
  const [showHRHistory, setShowHRHistory] = useState(false);
  const [showAnxietyHistory, setShowAnxietyHistory] = useState(false);
  const [showAuraM, setShowAuraM] = useState(false);
  const [showDailyAverageHistory, setShowDailyAverageHistory] = useState(false);
  const [chartData, setChartData] = useState<AnxietyDataPoint[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [showHourlyEditor, setShowHourlyEditor] = useState(false);
  const [showWisdomLog, setShowWisdomLog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualAnxiety, setManualAnxiety] = useState(50);
  const [manualHR, setManualHR] = useState(70);
  const [manualHour, setManualHour] = useState(new Date().getHours());
  const [zoomLevel, setZoomLevel] = useState(1);
  const chartScrollRef = useRef<HTMLDivElement>(null);

  const generateInitialData = useCallback(() => {
    const data: AnxietyDataPoint[] = [];
    const now = new Date();
    // Start from 24 hours ago, 96 points (every 15 mins)
    for (let i = 0; i < 96; i++) {
      const date = new Date(now.getTime() - (95 - i) * 15 * 60 * 1000);
      const hour = date.getHours();
      
      // Smooth baseline with some "natural" variation
      const baseLevel = 35 + Math.sin(i / 12) * 15 + Math.random() * 5;
      const baseHR = 68 + Math.cos(i / 15) * 8 + Math.random() * 4;
      
      // Compute Aura M: A balanced metric between HR and Anxiety
      const auraM = Math.min(100, Math.max(0, Math.round((baseLevel * 0.6 + (baseHR - 60) * 1.2))));

      data.push({
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        level: Math.round(baseLevel),
        heartRate: Math.round(baseHR),
        auraM: auraM,
        adjustedLevel: Math.round(baseLevel),
        timestamp: date.getTime(),
        hour: hour
      });
    }
    return data;
  }, []);

  useEffect(() => {
    const loadData = () => {
      const savedLogs = localStorage.getItem('aura_anxiety_logs');
      let initialData: AnxietyDataPoint[] = [];

      if (savedLogs) {
        const parsedData = JSON.parse(savedLogs) as AnxietyDataPoint[];
        const now = new Date();
        const lastPoint = parsedData[parsedData.length - 1];
        
        if (lastPoint && lastPoint.timestamp) {
          const diff = now.getTime() - lastPoint.timestamp;
          const missingIntervals = Math.floor(diff / (15 * 60 * 1000));

          if (missingIntervals > 0) {
            // Data is old, shift it to current time
            let syncedData = [...parsedData];
            for (let i = 1; i <= missingIntervals; i++) {
              const nextTime = new Date(lastPoint.timestamp + i * 15 * 60 * 1000);
              const hour = nextTime.getHours();
              
              // New baseline points for the "missing" time
              const baseLevel = 35 + Math.sin((parsedData.length + i) / 12) * 15 + Math.random() * 5;
              const baseHR = 68 + Math.cos((parsedData.length + i) / 15) * 8 + Math.random() * 4;
              const auraM = Math.min(100, Math.max(0, Math.round((baseLevel * 0.6 + (baseHR - 60) * 1.2))));

              syncedData.push({
                time: nextTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                level: Math.round(baseLevel),
                heartRate: Math.round(baseHR),
                auraM: auraM,
                adjustedLevel: Math.round(baseLevel),
                timestamp: nextTime.getTime(),
                hour: hour
              });
            }
            initialData = syncedData.slice(-96);
          } else {
            initialData = parsedData;
          }
        } else {
          initialData = generateInitialData();
        }

        // Migrate data to include auraM if missing
        initialData = initialData.map(p => {
          if (p.auraM === undefined) {
            return {
              ...p,
              auraM: Math.min(100, Math.max(0, Math.round((p.level * 0.6 + (p.heartRate - 60) * 1.2))))
            };
          }
          return p;
        });
        setChartData(initialData);
      } else {
        setChartData(generateInitialData());
      }
      
      const savedSchedules = localStorage.getItem('aura_schedules');
      if (savedSchedules) {
        const today = new Date().toISOString().split('T')[0];
        const items = JSON.parse(savedSchedules) as ScheduleItem[];
        setScheduleItems(items.filter(i => i.date === today));
      }
      setIsLoading(false);
    };
    loadData();
  }, [generateInitialData]);

  // Auto-scroll to end of graph on load to show most recent data
  useEffect(() => {
    if (chartScrollRef.current && chartData.length > 0 && !isLoading) {
      setTimeout(() => {
        if (chartScrollRef.current) {
          chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
        }
      }, 500);
    }
  }, [chartData.length, isLoading]);

  // Safety check to ensure auraM is always present
  useEffect(() => {
    if (chartData.length > 0 && chartData.some(p => p.auraM === undefined)) {
      setChartData(prev => prev.map(p => {
        if (p.auraM === undefined) {
          return {
            ...p,
            auraM: Math.min(100, Math.max(0, Math.round((p.level * 0.6 + (p.heartRate - 60) * 1.2))))
          };
        }
        return p;
      }));
    }
  }, [chartData]);

  const logManualState = () => {
    setChartData(prev => {
      let newData = [...prev];
      
      // If for some reason it's empty, generate baseline
      if (newData.length === 0) {
        newData = generateInitialData();
      }

      // Find if we have points for this hour in our 24h window
      const hasHour = newData.some(p => p.hour === manualHour);
      
      if (hasHour) {
        // Update all 15-min intervals for that hour to reflect the manual log
        newData = newData.map(p => {
          if (p.hour === manualHour) {
            const auraM = Math.min(100, Math.max(0, Math.round((manualAnxiety * 0.6 + (manualHR - 60) * 1.2))));
            return {
              ...p,
              level: manualAnxiety,
              heartRate: manualHR,
              auraM: auraM,
              adjustedLevel: manualAnxiety
            };
          }
          return p;
        });
      } else {
        // Fallback: append if not found (shouldn't happen with 24h baseline)
        const logDate = new Date();
        logDate.setHours(manualHour, 0, 0, 0);
        const auraM = Math.min(100, Math.max(0, Math.round((manualAnxiety * 0.6 + (manualHR - 60) * 1.2))));
        const newPoint: AnxietyDataPoint = {
          time: logDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          level: manualAnxiety,
          heartRate: manualHR,
          auraM: auraM,
          adjustedLevel: manualAnxiety,
          timestamp: logDate.getTime(),
          hour: manualHour
        };
        newData.push(newPoint);
        newData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      }

      const updated = newData.slice(-96);
      localStorage.setItem('aura_anxiety_logs', JSON.stringify(updated));
      return updated;
    });
    setShowManualLog(false);
  };

  // Get message of the day based on date, refreshing at 6 AM
  const getMessageOfDay = () => {
    const now = new Date();
    // If before 6 AM, use yesterday's message
    const effectiveDate = new Date(now);
    if (now.getHours() < 6) {
      effectiveDate.setDate(now.getDate() - 1);
    }
    
    const start = new Date(effectiveDate.getFullYear(), 0, 0);
    const diff = (effectiveDate.getTime() - start.getTime()) + ((start.getTimezoneOffset() - effectiveDate.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const yearOffset = (effectiveDate.getFullYear() - 2024) * 365;
    const index = (yearOffset + dayOfYear) % MORNING_MESSAGES.length;
    return MORNING_MESSAGES[index];
  };

  const messageOfDay = getMessageOfDay();

  const [showAuraGraph, setShowAuraGraph] = useState(false);

  const scheduleHrv = useMemo(() => {
    // Base HRV is 80, influenced heavily by schedule
    let baseHrv = 80;
    
    if (scheduleItems.length === 0) return baseHrv;
    
    // Calculate a "Schedule-derived HRV"
    // High expected stress from upcoming events reduces HRV
    const totalExpectedStress = scheduleItems.reduce((acc, item) => acc + item.expectedStress, 0);
    const avgStress = totalExpectedStress / scheduleItems.length;
    
    // Max penalty of 40ms for high stress schedule
    const penalty = (avgStress / 10) * 40;
    return Math.max(20, Math.round(baseHrv - penalty));
  }, [scheduleItems]);

  const weeklyTrends = useMemo(() => {
    // Generate simulated weekly data based on current baseline
    // In a real app, this would come from a database of historical logs
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDay = new Date().getDay(); // 0 is Sun
    const adjustedDays = [...days.slice(currentDay), ...days.slice(0, currentDay)];
    
    return adjustedDays.map((day, i) => {
      const isToday = i === 6;
      const baseLevel = isToday 
        ? (chartData.length > 0 ? chartData.reduce((acc, p) => acc + p.level, 0) / chartData.length : 35)
        : 35 + Math.random() * 20;
      
      return {
        day,
        level: Math.round(baseLevel),
        isToday
      };
    });
  }, [chartData]);

  return (
    <>
      <div className="space-y-6 sm:space-y-12 relative">
      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {onNavigateToSchedule && (
          <button 
            onClick={onNavigateToSchedule}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-3"
          >
            <Calendar className="w-4 h-4 text-white" />
            CALENDAR
          </button>
        )}
      </div>

      {/* Log Modal */}
      <AnimatePresence>
        {showManualLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-border space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-foreground">Aura Entry</h3>
                <button onClick={() => setShowManualLog(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Anxiety Level</label>
                    <span className="text-2xl font-black text-blue-500">{manualAnxiety}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={manualAnxiety}
                    onChange={(e) => setManualAnxiety(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Heart Rate (BPM)</label>
                    <span className="text-2xl font-black text-red-500">{manualHR}</span>
                  </div>
                  <input 
                    type="range" 
                    min="40" 
                    max="160" 
                    value={manualHR}
                    onChange={(e) => setManualHR(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Time of Day (Hour)</label>
                    <span className="text-2xl font-black text-indigo-500">
                      {new Date(new Date().setHours(manualHour, 0, 0, 0)).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="23" 
                    value={manualHour}
                    onChange={(e) => setManualHour(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <button 
                onClick={logManualState}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                Save Aura Log
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Wisdom Log */}
      <AnimatePresence>
        {showWisdomLog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm text-center relative group"
          >
            <button 
              onClick={() => setShowWisdomLog(false)}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <Quote className="w-8 h-8 text-indigo-100" />
              </div>
              <h4 className="text-xl md:text-3xl font-serif italic text-foreground leading-tight">
                {messageOfDay.p}
              </h4>
              <div className="w-12 h-0.5 bg-indigo-100 mx-auto" />
              <p className="text-base text-slate-500 font-medium italic">
                "{messageOfDay.t}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
        <div 
          className="flex items-center justify-between cursor-pointer group"
          onClick={() => setShowAnxietyHistory(!showAnxietyHistory)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
              <History className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h4 className="font-bold text-foreground flex items-center gap-3">
                Anxiety History
                <motion.div
                  animate={{ rotate: showAnxietyHistory ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </motion.div>
              </h4>
              <p className="text-xs text-slate-500">Weekly progression and significant events</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400">Baseline</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-indigo-400 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400">Spikes</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showAnxietyHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-6"
            >
              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-border">
                <div className="space-y-4">
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest">Weekly Trends</h5>
                  <div className="h-48 w-full bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl p-4 border border-border/50">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xl text-[10px] font-black uppercase tracking-widest border border-slate-700">
                                  {payload[0].value}% Stress
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="level" 
                          radius={[4, 4, 0, 0]} 
                          barSize={24}
                        >
                          {weeklyTrends.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.isToday ? '#3b82f6' : '#cbd5e1'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest">Significant Triggers</h5>
                  <div className="space-y-3">
                    {chartData.length > 0 ? (
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-blue-500 uppercase">Latest Entry</span>
                          <span className="text-[10px] text-slate-400">{chartData[chartData.length-1].time}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Manual data is being processed. Current anxiety level: {Math.round(chartData[chartData.length-1].level)}%.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">No significant triggers detected in real data yet.</p>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-center">
          <button 
            onClick={() => setShowManualLog(true)}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-3"
          >
            <Save className="w-4 h-4" />
            Aura Log
          </button>
        </div>

        <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden">
          <div 
            className="p-6 sm:p-10 flex items-center justify-between cursor-pointer group hover:bg-muted/30 transition-colors"
            onClick={() => setShowAuraGraph(!showAuraGraph)}
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Activity className="w-7 h-7 text-blue-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                  Aura Graph
                  <motion.div
                    animate={{ rotate: showAuraGraph ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </motion.div>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Holistic biometric timeline and stress analysis</p>
              </div>
            </div>

            <div className="hidden sm:flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aura</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stress</span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showAuraGraph && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 sm:p-10 pt-0 space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Heart Rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Aura M</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Stress</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-border/50">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(0.25, prev - 0.25)); }}
                        className="p-1.5 hover:bg-card rounded-xl text-slate-500 hover:text-foreground transition-all shadow-sm border border-transparent hover:border-border"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <div className="px-2 min-w-[3.5rem] text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(4, prev + 0.25)); }}
                        className="p-1.5 hover:bg-card rounded-xl text-slate-500 hover:text-foreground transition-all shadow-sm border border-transparent hover:border-border"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={chartScrollRef}
                    className="h-[500px] w-full overflow-x-auto scrollbar-hide scroll-smooth border border-border/50 rounded-[2rem] bg-slate-50/10"
                  >
                    <div style={{ width: `${zoomLevel * 4000}px`, height: '100%', minWidth: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          data={chartData}
                          margin={{ left: 30, right: 100, top: 20, bottom: 60 }}
                        >
                          <defs>
                            <linearGradient id="auraGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={true} 
                            horizontal={true}
                            stroke="#e2e8f0" 
                            opacity={0.4} 
                          />
                          <XAxis 
                            dataKey="time" 
                            axisLine={{ stroke: '#64748b', strokeWidth: 1 }} 
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                            dy={15}
                            interval={0} 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          
                          {/* Combined Left Side Y-Axis for Aligned Scales */}
                          <YAxis 
                            yAxisId="left"
                            type="number"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            width={80}
                            tick={(props: any) => {
                              const { x, y, payload } = props;
                              const auraValue = payload.value;
                              const hrValue = 40 + (auraValue * 1.2);
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text x={0} y={0} dy={4} textAnchor="end" fill="#64748b" fontSize={11} fontWeight="black">
                                    {auraValue}
                                  </text>
                                  <text x={-28} y={3} textAnchor="middle" fill="#cbd5e1" fontSize={11} fontWeight="light">|</text>
                                  <text x={-35} y={0} dy={4} textAnchor="end" fill="#ef4444" fontSize={11} fontWeight="black">
                                    {Math.round(hrValue)}
                                  </text>
                                </g>
                              );
                            }}
                          />

                          {/* Invisible Right Y-Axis strictly for HR line placement */}
                          <YAxis 
                            yAxisId="right"
                            type="number"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            domain={[40, 160]}
                            width={0}
                            hide={true}
                          />

                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{data.time}</p>
                                    <div className="flex items-center justify-between gap-8">
                                      <span className="text-xs font-bold text-red-400">Heart Rate</span>
                                      <span className="text-xs font-black">{data.heartRate} BPM</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-8">
                                      <span className="text-xs font-bold text-blue-400">Aura M</span>
                                      <span className="text-xs font-black">{data.auraM}%</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-8">
                                      <span className="text-xs font-bold text-yellow-400">Logged Stress</span>
                                      <span className="text-xs font-black">{data.level}/100</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />

                          {/* Heart Rate Line */}
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="heartRate" 
                            stroke="#ef4444" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: '#ef4444' }}
                          />

                          {/* Aura M Area */}
                          <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="auraM" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#auraGradient)" 
                            activeDot={{ r: 8, fill: '#3b82f6' }}
                          />

                          {/* Logged Stress (level) Line */}
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="level" 
                            stroke="#facc15" 
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 6, fill: '#facc15' }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        <div className="space-y-4">
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setShowHRHistory(!showHRHistory)}
            className="bg-card p-6 rounded-3xl shadow-sm border border-border flex items-center gap-4 cursor-pointer group relative overflow-hidden"
          >
            <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-red-100 transition-colors">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">Logged HR</p>
                <motion.div
                  animate={{ rotate: showHRHistory ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-red-500 transition-colors" />
                </motion.div>
              </div>
              <p className="text-2xl font-bold">{chartData.length > 0 ? `${Math.round(chartData[chartData.length-1].heartRate)} BPM` : "--"}</p>
            </div>
          </motion.div>

          <AnimatePresence>
            {showHRHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground">Heart Rate History</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 24 Hours</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {chartData.length > 0 ? (
                      chartData.slice(-24).map((point, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[45px]">
                          <div className="w-full bg-red-50 rounded-t-lg relative" style={{ height: `${Math.max(10, (point.heartRate - 40) / 120 * 80)}px` }}>
                            <div className="absolute bottom-0 w-full bg-red-400 rounded-t-lg" style={{ height: '100%' }} />
                          </div>
                          <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{point.time.split(':')[0]}{point.time.slice(-2)}</span>
                            <span className="text-[10px] font-black text-slate-700 leading-none">{Math.round(point.heartRate)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
                        <p className="text-xs text-slate-400">No heart rate data logged yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setShowAuraM(!showAuraM)}
            className="bg-card p-6 rounded-3xl shadow-sm border border-border flex items-center gap-4 cursor-pointer group relative overflow-hidden"
          >
            <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-colors">
              <Sun className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">Aura M</p>
                <motion.div
                  animate={{ rotate: showAuraM ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </motion.div>
              </div>
              <p className="text-2xl font-bold">
                {chartData.length > 0 ? `${Math.round(chartData[chartData.length - 1].auraM || 0)}%` : "--"}
              </p>
            </div>
          </motion.div>

          <AnimatePresence>
            {showAuraM && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-foreground">Schedule Resonance</h4>
                      {scheduleItems.length > 0 && (
                        <span className="text-sm font-black text-blue-500">
                          {Math.round(scheduleItems.reduce((a, b) => a + b.expectedStress, 0) / scheduleItems.length * 10)}%
                        </span>
                      )}
                    </div>
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  
                  {scheduleItems.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-400">No events scheduled for today.</p>
                      <p className="text-[10px] text-slate-300 mt-1">Your Aura is in a state of pure rest.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scheduleItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-border">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              item.expectedStress > 7 ? "bg-red-500" : item.expectedStress > 4 ? "bg-yellow-500" : "bg-emerald-500"
                            )} />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.title}</p>
                              <p className="text-[10px] text-slate-500">{item.startTime}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stress</p>
                            <p className="text-xs font-bold text-slate-700">{item.expectedStress}/10</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setShowDailyAverageHistory(!showDailyAverageHistory)}
            className="bg-card p-6 rounded-3xl shadow-sm border border-border flex items-center gap-4 cursor-pointer group relative overflow-hidden"
          >
            <div className="p-3 bg-yellow-50 rounded-2xl group-hover:bg-yellow-100 transition-colors">
              <Activity className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">Logged Stress</p>
                <motion.div
                  animate={{ rotate: showDailyAverageHistory ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-yellow-500 transition-colors" />
                </motion.div>
              </div>
              <p className="text-2xl font-bold">{chartData.length > 0 ? `${Math.round(chartData[chartData.length-1].level)}/100` : "--"}</p>
            </div>
          </motion.div>

          <AnimatePresence>
            {showDailyAverageHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Daily Average Trends</h4>
                      <p className="text-xs text-slate-500">30-day overview of your anxiety baseline</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Avg</p>
                        <p className="text-lg font-bold text-yellow-500">28%</p>
                      </div>
                      <div className="w-px h-8 bg-slate-100" />
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Improvement</p>
                        <p className="text-lg font-bold text-emerald-500">-12%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 md:grid-cols-10 gap-2">
                    {chartData.length > 0 ? (
                      chartData.slice(-30).map((point, i) => (
                        <div key={i} className="group relative">
                          <div 
                            className={cn(
                              "aspect-square rounded-lg transition-all duration-300",
                              point.level > 60 ? "bg-red-100" : point.level > 40 ? "bg-yellow-100" : "bg-emerald-100"
                            )}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {point.time}: {Math.round(point.level)}%
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-muted/30 rounded-3xl border border-dashed border-border">
                        <p className="text-xs text-slate-400">No manual logs available yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                    <span>30 Days Ago</span>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-100 rounded" />
                        <span>Low</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-100 rounded" />
                        <span>Mid</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-100 rounded" />
                        <span>High</span>
                      </div>
                    </div>
                    <span>Today</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </>
);
};
