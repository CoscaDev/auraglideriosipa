import React from 'react';
import { Bell, Trash2, CheckCircle2, Clock, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Notification } from '../types';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClear: () => void;
  onAction?: (eventId?: string) => void;
  onStartExercise?: (exerciseType: string, duration?: number) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAsRead, onClear, onAction, onStartExercise }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-xl">
            <Bell className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">Recent Alerts</h3>
            <p className="text-slate-500 text-xs font-medium">Stay ahead of your stress</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-[2.5rem] border border-border"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400">All caught up!</p>
              <p className="text-xs text-slate-300 mt-1">No new notifications at the moment.</p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all relative group",
                  notif.read 
                    ? "bg-muted/50 border-border opacity-60" 
                    : "bg-card border-border shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none hover:border-sky-200"
                )}
              >
                {!notif.read && (
                  <div className="absolute top-6 right-6 w-2 h-2 bg-sky-500 rounded-full shadow-lg shadow-sky-200 dark:shadow-none" />
                )}
                
                <div className="flex gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0",
                    notif.read ? "bg-slate-100 text-slate-400" : "bg-sky-50 text-sky-500"
                  )}>
                    <Sun className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        "font-bold text-sm truncate",
                        notif.read ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed mb-4",
                      notif.read ? "text-slate-400" : "text-slate-600"
                    )}>
                      {notif.message}
                    </p>
                    
                    {!notif.read && (
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => onMarkAsRead(notif.id)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-600 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark as Read
                        </button>
                        {notif.recommendedExercise && onStartExercise ? (
                          <button 
                            onClick={() => onStartExercise(notif.recommendedExercise!, notif.recommendedDuration)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-600 transition-colors"
                          >
                            <Sun className="w-3.5 h-3.5" />
                            START {notif.recommendedExercise.toUpperCase().replace('-', ' ')}
                          </button>
                        ) : notif.eventId && onAction && (
                          <button 
                            onClick={() => onAction(notif.eventId)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Sun className="w-3.5 h-3.5" />
                            View Stress Plan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
