import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionValueEvent } from 'motion/react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, ChevronDown, RotateCcw, Wind } from 'lucide-react';
import { cn } from '../lib/utils';

// Real-time Phase Countdown Component
const PhaseCountdown = ({ timerMV, duration }: { timerMV: any, duration: number }) => {
  const displayRef = useRef<HTMLSpanElement>(null);
  
  useMotionValueEvent(timerMV, "change", (latest: number) => {
    if (displayRef.current) {
      const s = Math.max(0, Math.ceil((duration - latest) / 1000));
      displayRef.current.innerText = `${s}s`;
    }
  });

  // Reset display when duration changes
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.innerText = `${Math.ceil(duration / 1000)}s`;
    }
  }, [duration]);

  return <span ref={displayRef}>{Math.ceil(duration / 1000)}s</span>;
};

interface GliderGameProps {
  onComplete: (averageHarmony: number) => void;
  onCancel: () => void;
  duration?: number; // in seconds
  initialTechniqueId?: string;
}

type BreathingState = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const TECHNIQUES: BreathingTechnique[] = [
  { id: 'dirga', name: 'Dirga', description: 'Three-Part Breath: Focus on filling the belly, then ribs, then upper chest in sequence.', inhale: 6000, holdIn: 0, exhale: 6000, holdOut: 0 },
  { id: 'ujjayi', name: 'Ujjayi', description: 'Ocean Breath: Constrict the throat slightly to create a soothing sound and control airflow.', inhale: 5000, holdIn: 0, exhale: 5000, holdOut: 0 },
  { id: 'calm', name: 'Calm (1:2)', description: 'Soothe the nerves with extended exhales. Perfect for immediate stress relief.', inhale: 4000, holdIn: 0, exhale: 8000, holdOut: 0 },
  { id: 'calm1', name: 'Calm1 (4:7:8)', description: 'The 4-7-8 technique: Inhale for 4s, hold for 7s, and exhale for 8s to deeply relax the nervous system.', inhale: 4000, holdIn: 7000, exhale: 8000, holdOut: 0 },
  { id: 'bhramari', name: 'Bhramari', description: 'Humming Bee: Create a gentle hum on the exhale to calm the mind and reduce noise.', inhale: 4000, holdIn: 0, exhale: 8000, holdOut: 0 },
  { id: 'box', name: 'Sama Vritti', description: 'Box Breathing: Equal counts for inhale, hold, exhale, and hold to ground the mind.', inhale: 4000, holdIn: 4000, exhale: 4000, holdOut: 4000 },
  { id: 'anulom', name: 'Anulom Vilom', description: 'Natural Alternate: Alternate nostrils without holds to balance the subtle energy channels.', inhale: 4000, holdIn: 0, exhale: 4000, holdOut: 0 },
  { id: 'nadi', name: 'Nadi Shodhana', description: 'Alternate Nostril: Balance energy by alternating airflow between left and right nostrils with holds.', inhale: 4000, holdIn: 4000, exhale: 4000, holdOut: 4000 },
  { id: 'shitali', name: 'Shitali', description: 'Cooling Breath: Inhale through a curled tongue to physically cool the body.', inhale: 4000, holdIn: 2000, exhale: 4000, holdOut: 0 },
  { id: 'sheetkari', name: 'Sheetkari', description: 'Hissing Breath: Inhale through the teeth to cool the system and soothe the senses.', inhale: 4000, holdIn: 2000, exhale: 4000, holdOut: 0 },
  { id: 'chandra', name: 'Chandra Bhedana', description: 'Moon Piercing: Inhale only through the left nostril to activate the cooling, lunar energy.', inhale: 4000, holdIn: 4000, exhale: 4000, holdOut: 0 },
  { id: 'surya', name: 'Surya Bhedana', description: 'Sun Piercing: Inhale only through the right nostril to activate heating, solar energy.', inhale: 4000, holdIn: 4000, exhale: 4000, holdOut: 0 },
  { id: 'viloma', name: 'Viloma', description: 'Interrupted Breath: Pause during inhalation to increase control and capacity.', inhale: 6000, holdIn: 2000, exhale: 6000, holdOut: 0 },
  { id: 'kapalabhati', name: 'Kapalabhati', description: 'Skull Shining: Rapid, forceful exhales driven by sharp abdominal contractions.', inhale: 1000, holdIn: 0, exhale: 500, holdOut: 0 },
  { id: 'bhastrika', name: 'Bhastrika', description: 'Bellows Breath: Forceful, rapid inhales and exhales to energize and heat the body.', inhale: 1000, holdIn: 0, exhale: 1000, holdOut: 0 },
  { id: 'agnisar', name: 'Agnisar Kriya', description: 'Fire Wash: Focus on abdominal movement during the external hold to stimulate digestion.', inhale: 4000, holdIn: 0, exhale: 2000, holdOut: 6000 },
  { id: 'bahya', name: 'Bahya Pranayama', description: 'External Hold: A powerful practice involving a deep exhale followed by a long external hold.', inhale: 3000, holdIn: 0, exhale: 3000, holdOut: 6000 },
  { id: 'udgeeth', name: 'Udgeeth', description: 'Om Chanting: Deep resonance through the vocal cords to harmonize the body.', inhale: 4000, holdIn: 0, exhale: 12000, holdOut: 0 },
  { id: 'murccha', name: 'Murccha', description: 'Swooning Breath: Advanced practice involving long internal holds to induce deep stillness.', inhale: 6000, holdIn: 12000, exhale: 6000, holdOut: 0 },
  { id: 'plavini', name: 'Plavini', description: 'Floating Breath: Advanced technique involving air retention to create a sense of lightness.', inhale: 8000, holdIn: 16000, exhale: 8000, holdOut: 0 },
  { id: 'kevala', name: 'Kevala Kumbhaka', description: 'Ultimate Stillness: Spontaneous suspension of breath in deep meditation.', inhale: 10000, holdIn: 20000, exhale: 10000, holdOut: 10000 },
];

// Meditative Figure Component for Airflow Visualization
const Mannequin = React.memo(({ state, timerMV, duration, techniqueId, cycleIndex = 0 }: { state: BreathingState, timerMV: any, duration: number, techniqueId: string, cycleIndex?: number }) => {
  const isInhale = state === 'inhale';
  const isExhale = state === 'exhale';
  const isHold = state === 'hold-in' || state === 'hold-out';
  
  // Chest expansion - Linear for precise synchronization
  const progress = useTransform(timerMV, (t: number) => {
    if (duration <= 0) return 0;
    return Math.max(0, Math.min(1, t / duration));
  });
  
  const chestScale = 1;

  const lungFill = 0;

  // Technique-specific visual logic
  const isDirga = techniqueId === 'dirga';
  const isUjjayi = techniqueId === 'ujjayi';
  const isBhramari = techniqueId === 'bhramari';
  const isNadi = techniqueId === 'nadi' || techniqueId === 'anulom';
  const isShitali = techniqueId === 'shitali' || techniqueId === 'sheetkari';
  const isKapala = techniqueId === 'kapalabhati' || techniqueId === 'bhastrika';
  const isUdgeeth = techniqueId === 'udgeeth';
  const isBox = techniqueId === 'box';
  const isViloma = techniqueId === 'viloma';
  const isCalm = techniqueId === 'calm' || techniqueId === 'calm1';
  const isSurya = techniqueId === 'surya';
  const isChandra = techniqueId === 'chandra';
  const isAgnisar = techniqueId === 'agnisar' || techniqueId === 'bahya';
  const isAdvanced = techniqueId === 'murccha' || techniqueId === 'plavini' || techniqueId === 'kevala';

  const isEvenCycle = cycleIndex % 2 === 0;

  const getDetailLabel = () => {
    if (isDirga) {
      if (isInhale) {
        const p = progress.get();
        if (p < 0.33) return "Belly Breath";
        if (p < 0.66) return "Rib Expansion";
        return "Chest Fill";
      }
      return "Release Top-Down";
    }
    if (isUjjayi) return "Throat Focus";
    if (isBhramari && isExhale) return "Nasal Humming";
    if (isNadi) {
      if (state === 'hold-in' || state === 'hold-out') return "Hold";
      if (isEvenCycle) {
        return isInhale ? "Inhale Left" : "Exhale Right";
      } else {
        return isInhale ? "Inhale Right" : "Exhale Left";
      }
    }
    if (isSurya) return isInhale ? "Inhale Right" : "Exhale Left";
    if (isChandra) return isInhale ? "Inhale Left" : "Exhale Right";
    if (isShitali && isInhale) return techniqueId === 'sheetkari' ? "Teeth Cooling" : "Mouth Cooling";
    if (isKapala && isExhale) return techniqueId === 'bhastrika' ? "Bellows Pump" : "Abdominal Snap";
    if (isAgnisar && state === 'hold-out') return "Abdominal Fire";
    if (isAdvanced && state === 'hold-in') return "Deep Stillness";
    if (isUdgeeth && isExhale) return "Throat Chant";
    if (isBox) return "Nasal Box";
    if (isViloma) return "Nasal Interrupted";
    if (isCalm) return "Diaphragm Calm";
    return "Nasal Breath";
  };

  return (
    <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 sm:w-64 sm:h-80 pointer-events-none z-0")}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={getDetailLabel()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-[0.2em] whitespace-nowrap"
          >
            {getDetailLabel()}
          </motion.span>
        </AnimatePresence>
      </div>

      <svg viewBox="0 0 100 120" className="w-full h-full fill-none stroke-indigo-400/40 dark:stroke-indigo-300/30 stroke-[1.5]">
        {/* Aura Pulse */}
        <motion.circle 
          cx="50" cy="55" r="35"
          className="fill-orange-500/5 dark:fill-orange-500/5 stroke-none"
          animate={{ 
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Meditative Figure - Lotus Pose */}
        {/* Head */}
        <circle cx="50" cy="25" r="8" className="stroke-indigo-400/60 dark:stroke-indigo-300/40" />
        
        {/* Lungs Visualization */}
        <g className="opacity-40">
          {/* Left Lung */}
          <motion.path 
            d="M48,45 Q40,45 38,60 Q38,75 48,75 Z" 
            className="fill-orange-500/20 stroke-orange-500/40"
            style={{ opacity: lungFill }}
          />
          {/* Right Lung */}
          <motion.path 
            d="M52,45 Q60,45 62,60 Q62,75 52,75 Z" 
            className="fill-orange-500/20 stroke-orange-500/40"
            style={{ opacity: lungFill }}
          />
        </g>

        {/* Torso (Expands with breath) */}
        <motion.path
          style={{ scale: chestScale, originX: "50%", originY: "50%" }}
          d="M35,45 Q50,38 65,45 L70,80 Q50,88 30,80 Z"
          className="stroke-indigo-400/60 dark:stroke-indigo-300/40"
        />

        {/* Dirga - Three Part Indicators */}
        {isDirga && (
          <g>
            {/* Belly */}
            <motion.circle 
              cx="50" cy="75" r="4" 
              className="fill-orange-500/60"
              animate={{ 
                opacity: isInhale && progress.get() < 0.33 ? 1 : 0.4
              }}
            />
            {/* Ribs */}
            <motion.circle 
              cx="50" cy="60" r="4" 
              className="fill-orange-500/60"
              animate={{ 
                opacity: isInhale && progress.get() >= 0.33 && progress.get() < 0.66 ? 1 : 0.4
              }}
            />
            {/* Chest */}
            <motion.circle 
              cx="50" cy="45" r="4" 
              className="fill-orange-500/60"
              animate={{ 
                opacity: isInhale && progress.get() >= 0.66 ? 1 : 0.4
              }}
            />
          </g>
        )}

        {/* Box Breathing - Square Frame */}
        {isBox && (
          <g className="opacity-80">
            <rect x="30" y="30" width="40" height="40" rx="4" className="stroke-indigo-300/60 dark:stroke-indigo-700/60" />
            <motion.path
              d={
                state === 'inhale' ? "M30,70 L30,30" :
                state === 'hold-in' ? "M30,30 L70,30" :
                state === 'exhale' ? "M70,30 L70,70" :
                "M70,70 L30,70"
              }
              className="stroke-orange-500 stroke-2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </g>
        )}

        {/* Ujjayi - Throat Focus */}
        {isUjjayi && (
          <motion.g>
            <motion.circle 
              cx="50" cy="35" r="4"
              className="stroke-orange-500 fill-orange-500/40"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path 
              d="M45,35 Q50,40 55,35" 
              className="stroke-orange-500/60 stroke-2"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
            />
          </motion.g>
        )}

        {/* Bhramari - Sound Waves */}
        {isBhramari && isExhale && (
          <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.5, repeat: Infinity }}>
            <path d="M40,25 Q35,25 30,20" className="stroke-orange-500 stroke-2" />
            <path d="M60,25 Q65,25 70,20" className="stroke-orange-500 stroke-2" />
            <path d="M40,35 Q35,35 30,40" className="stroke-orange-500 stroke-2" />
            <path d="M60,35 Q65,35 70,40" className="stroke-orange-500 stroke-2" />
          </motion.g>
        )}

        {/* Nadi Shodhana / Anulom Vilom - Nostril Alternation */}
        {isNadi && (
          <g>
            <motion.circle 
              cx={isEvenCycle ? (isInhale ? 47 : 53) : (isInhale ? 53 : 47)} cy="32" r="3"
              className="fill-orange-500"
              animate={{ opacity: [0.6, 1, 0.6] }}
            />
            {/* Hand Gesture Visualization */}
            <path d="M50,35 L50,42" className="stroke-indigo-400/60 dark:stroke-indigo-300/40 stroke-2" />
          </g>
        )}

        {/* Surya Bhedana - Right Nostril Focus */}
        {isSurya && (
          <g>
            <motion.circle 
              cx={isInhale ? 53 : 47} cy="32" r="3"
              className="fill-orange-500"
              animate={{ opacity: [0.6, 1, 0.6] }}
            />
          </g>
        )}

        {/* Chandra Bhedana - Left Nostril Focus */}
        {isChandra && (
          <g>
            <motion.circle 
              cx={isInhale ? 47 : 53} cy="32" r="3"
              className="fill-orange-500"
              animate={{ opacity: [0.6, 1, 0.6] }}
            />
          </g>
        )}

        {/* Shitali / Sheetkari - Cooling Mouth */}
        {isShitali && isInhale && (
          <motion.g>
            <motion.circle 
              cx="50" cy="33" r="5"
              className="fill-orange-500/50 stroke-orange-500"
            />
            <motion.path 
              d="M47,33 L53,33" 
              className="stroke-orange-500 stroke-2"
              animate={{ opacity: [0.6, 1, 0.6] }}
            />
          </motion.g>
        )}

        {/* Kapalabhati / Bhastrika - Sharp Abdominal Contraction */}
        {isKapala && (
          <motion.circle 
            cx="50" cy="70" r="8"
            className="stroke-orange-500 fill-orange-500/30"
            animate={(isExhale || (techniqueId === 'bhastrika' && isInhale)) ? { opacity: [0.4, 1, 0.4] } : {}}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Agnisar / Bahya - Abdominal Fire */}
        {isAgnisar && state === 'hold-out' && (
          <motion.circle 
            cx="50" cy="70" r="10"
            className="stroke-orange-500 fill-orange-500/40"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        )}

        {/* Advanced Holds - Deep Stillness */}
        {isAdvanced && state === 'hold-in' && (
          <motion.circle 
            cx="50" cy="55" r="42"
            className="stroke-orange-500/30 fill-orange-500/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        )}

        {/* Udgeeth - Om Vibration */}
        {isUdgeeth && isExhale && (
          <motion.circle 
            cx="50" cy="55" r="20"
            className="stroke-orange-500/40"
            animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {/* Viloma - Interrupted Path */}
        {isViloma && isInhale && (
          <g className="opacity-80">
          </g>
        )}

        {/* Calm - Soothing Downward Flow */}
        {isCalm && isExhale && (
          <motion.g animate={{ y: [0, 15], opacity: [0, 0.8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <path d="M45,35 Q50,50 55,35" className="stroke-orange-500/60 stroke-2" />
            <path d="M40,45 Q50,60 60,45" className="stroke-orange-500/50 stroke-2" />
          </motion.g>
        )}

        {/* Arms */}
        <path d="M35,45 C25,50 18,75 25,85" className="stroke-indigo-400/60 dark:stroke-indigo-300/40" />
        <path d="M65,45 C75,50 82,75 75,85" className="stroke-indigo-400/60 dark:stroke-indigo-300/40" />
        
        {/* Mudras (Hands) */}
        <circle cx="25" cy="85" r="2" className="fill-indigo-400 dark:fill-indigo-300" />
        <circle cx="75" cy="85" r="2" className="fill-indigo-400 dark:fill-indigo-300" />

        {/* Legs (Lotus) */}
        <path d="M30,80 C10,85 10,105 50,105 C90,105 90,85 70,80" className="stroke-indigo-400/60 dark:stroke-indigo-300/40" />
        <path d="M35,105 Q50,95 65,105" className="stroke-indigo-400/60 dark:stroke-indigo-300/40" />
      </svg>
    </div>
  );
});

export const GliderGame: React.FC<GliderGameProps> = ({ onComplete, onCancel, duration = 300, initialTechniqueId }) => {
  const [selectedTech, setSelectedTech] = useState<BreathingTechnique>(() => {
    if (initialTechniqueId) {
      const tech = TECHNIQUES.find(t => t.id === initialTechniqueId);
      if (tech) return tech;
    }
    return TECHNIQUES[0];
  });
  const [userHolding, setUserHolding] = useState(false);
  
  useEffect(() => {
    console.log('GliderGame Mounted with duration:', duration);
    return () => console.log('GliderGame Unmounted');
  }, [duration]);

  const [guideState, setGuideState] = useState<BreathingState>('exhale');
  const [breathCycle, setBreathCycle] = useState(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'success' | 'fail'>('playing');
  const [timeLeft, setTimeLeft] = useState(duration); 
  const [masteryAchieved, setMasteryAchieved] = useState(true); 
  const [sessionAvgHarmony, setSessionAvgHarmony] = useState<number | null>(null);
  
  const [isManualHold, setIsManualHold] = useState(false);
  const lastTapTimeRef = useRef(0);
  
  const [showPathway, setShowPathway] = useState(true);
  const [showFigure, setShowFigure] = useState(true);
  const [showUserGlider, setShowUserGlider] = useState(true);
  const userBaseYRef = useRef(85);
  const userVelocityRef = useRef(0);
  const userHoldingRef = useRef(false);
  const isManualHoldRef = useRef(false);
  const statusRef = useRef(status);
  const guideStateRef = useRef(guideState);
  const selectedTechRef = useRef(selectedTech);
  const timeLeftRef = useRef(timeLeft);
  const lastFrameTimeRef = useRef(Date.now());

  const [isSyncHigh, setIsSyncHigh] = useState(true);
  const [harmonyLevel, setHarmonyLevel] = useState(100);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  const ceiling = 15;
  const floor = 85;

  // Harmony History for "Gathered Data" calculation
  const harmonyHistoryRef = useRef<number[]>([]);
  const sessionHarmonyHistoryRef = useRef<number[]>([]);
  const MAX_HARMONY_HISTORY = 120; // 2 seconds at 60fps - smoother window

  // Motion Values for high-frequency updates (prevents re-renders)
  const timerMV = useMotionValue(0);
  const gliderYMV = useMotionValue(85);
  const gliderScaleMV = useMotionValue(1);
  const userGliderYMV = useMotionValue(85);
  const userGliderScaleMV = useMotionValue(1);
  const userIntensityMV = useMotionValue(0);
  const syncLevelMV = useMotionValue(100);

  // Helper to get duration from a tech (stable)
  const getTechPhaseDuration = useCallback((tech: BreathingTechnique, state: BreathingState) => {
    switch (state) {
      case 'inhale': return tech.inhale;
      case 'hold-in': return tech.holdIn;
      case 'exhale': return tech.exhale;
      case 'hold-out': return tech.holdOut;
    }
  }, []);

  // useTransform hooks MUST be at the top level
  const gliderYStyle = useTransform(gliderYMV, (y) => `${y}%`);
  const userGliderYStyle = useTransform(userGliderYMV, (y) => `${y}%`);
  const syncLevelPercent = useTransform(syncLevelMV, (s) => `${s}%`);

  const pathwayIndicatorCX = useTransform(timerMV, (t) => {
    const tech = selectedTechRef.current;
    const state = guideStateRef.current;
    const cycleDurations = [tech.exhale, tech.holdOut, tech.inhale, tech.holdIn];
    const totalCycleTime = cycleDurations.reduce((a, b) => a + b, 0);
    let accumulated = 0;
    if (state === 'hold-out') accumulated = tech.exhale;
    else if (state === 'inhale') accumulated = tech.exhale + tech.holdOut;
    else if (state === 'hold-in') accumulated = tech.exhale + tech.holdOut + tech.inhale;
    return ((accumulated + t) / totalCycleTime) * 100;
  });

  const pathwayIndicatorCY = useTransform(timerMV, (t) => {
    const state = guideStateRef.current;
    const tech = selectedTechRef.current;
    const duration = getTechPhaseDuration(tech, state);
    const progress = duration > 0 ? t / duration : 0;
    const easedProgress = (1 - Math.cos(progress * Math.PI)) / 2;

    return state === 'inhale' ? floor - (floor - ceiling) * easedProgress :
           state === 'hold-in' ? ceiling :
           state === 'exhale' ? ceiling + (floor - ceiling) * easedProgress :
           floor;
  });

  const breathingHaloScale = useTransform(gliderScaleMV, [1, 1.4], [1, 2.5]);
  const breathingHaloOpacity = useTransform(gliderScaleMV, [1, 1.4], [0.2, 0.6]);

  const userHaloScale = useTransform(userIntensityMV, [0, 100], [1, 3.5]);
  const userHaloOpacity = useTransform(userIntensityMV, [0, 100], [0, 0.7]);

  const timerProgressWidth = useTransform(timerMV, (t) => {
    const duration = getTechPhaseDuration(selectedTechRef.current, guideStateRef.current);
    return `${(t / Math.max(1, duration)) * 100}%`;
  });

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsManualHold(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync refs with state
  useEffect(() => { userHoldingRef.current = userHolding; }, [userHolding]);
  useEffect(() => { isManualHoldRef.current = isManualHold; }, [isManualHold]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { guideStateRef.current = guideState; }, [guideState]);
  useEffect(() => { selectedTechRef.current = selectedTech; }, [selectedTech]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  useMotionValueEvent(syncLevelMV, "change", (latest) => {
    setHarmonyLevel(latest);
    if (latest > 70 && !isSyncHigh) setIsSyncHigh(true);
    else if (latest <= 70 && isSyncHigh) setIsSyncHigh(false);
  });

  useMotionValueEvent(gliderYMV, "change", (latest) => {
    if ((latest < ceiling || latest > floor) && !isOutOfBounds) setIsOutOfBounds(true);
    else if (latest >= ceiling && latest <= floor && isOutOfBounds) setIsOutOfBounds(false);
  });

  const phaseStartTimeRef = useRef(Date.now());
  const requestRef = useRef<number | null>(null);

  const userProgressRef = useRef(0);

  const animate = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    const now = Date.now();
    const dt = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    
    const elapsed = now - phaseStartTimeRef.current;
    const currentDuration = getTechPhaseDuration(selectedTechRef.current, guideStateRef.current);

    if (elapsed >= currentDuration) {
      const tech = selectedTechRef.current;
      let nextState: BreathingState = 'exhale';
      
      setGuideState(current => {
        if (current === 'exhale') nextState = tech.holdOut > 0 ? 'hold-out' : 'inhale';
        else if (current === 'hold-out') nextState = 'inhale';
        else if (current === 'inhale') nextState = tech.holdIn > 0 ? 'hold-in' : 'exhale';
        else if (current === 'hold-in') nextState = 'exhale';
        
        // Increment cycle count when moving to inhale
        if (nextState === 'inhale') {
          setBreathCycle(c => c + 1);
        }
        
        return nextState;
      });

      // Fix timing drift by carrying over excess time to the next phase
      phaseStartTimeRef.current += currentDuration;
      timerMV.set(0);
    } else {
      timerMV.set(elapsed);
      
      // Physics Update
      const rawProgress = currentDuration > 0 ? elapsed / currentDuration : 0;
      const progress = Math.max(0, Math.min(1, rawProgress));
      
      // Sine-based easing for more natural breath rhythm
      const easedProgress = (1 - Math.cos(progress * Math.PI)) / 2;
      
      let idealY = 85;
      
      if (guideStateRef.current === 'inhale') {
        idealY = floor - (floor - ceiling) * easedProgress;
      } else if (guideStateRef.current === 'hold-in') {
        idealY = ceiling;
      } else if (guideStateRef.current === 'exhale') {
        idealY = ceiling + (floor - ceiling) * easedProgress;
      } else if (guideStateRef.current === 'hold-out') {
        idealY = floor;
      }
      
      // The guide glider should be perfectly stable and smooth
      gliderYMV.set(idealY);

      // Breathing Scale Animation for Guide Glider
      let targetScale = 1;
      if (guideStateRef.current === 'inhale') {
        targetScale = 1 + (easedProgress * 0.4);
      } else if (guideStateRef.current === 'hold-in') {
        targetScale = 1.4;
      } else if (guideStateRef.current === 'exhale') {
        targetScale = 1.4 - (easedProgress * 0.4);
      } else if (guideStateRef.current === 'hold-out') {
        targetScale = 1;
      }
      gliderScaleMV.set(targetScale);

      // User Glider Progress-based Physics
      // We move userProgressRef based on whether the user is holding or not
      // Responsiveness is now matched to the exercise's specific inhale/exhale durations
      // Using a 1.02x multiplier (15% less than 1.2x) to make it feel slightly more weighted
      const tech = selectedTechRef.current;
      const inhaleDur = Math.max(100, tech.inhale);
      const exhaleDur = Math.max(100, tech.exhale);
      const responsiveness = 1.02; 
      
      const userIsHold = isManualHoldRef.current;
      
      if (userHoldingRef.current) {
        userProgressRef.current = Math.min(1, userProgressRef.current + (dt / inhaleDur) * responsiveness);
      } else if (!userIsHold) {
        userProgressRef.current = Math.max(0, userProgressRef.current - (dt / exhaleDur) * responsiveness);
      }
      
      const easedUserProgress = (1 - Math.cos(userProgressRef.current * Math.PI)) / 2;
      const userY = floor - (floor - ceiling) * easedUserProgress;
      userGliderYMV.set(userY);

      // User Glider Scale Animation (Mirrors the guide's logic)
      const userTargetScale = 1 + (easedUserProgress * 0.4);
      userGliderScaleMV.set(userTargetScale);

      // Simulated intensity for manual mode (button hold or toggle hold)
      const targetIntensity = (userHoldingRef.current || isManualHoldRef.current) ? 40 : 0;
      const currentIntensity = userIntensityMV.get();
      userIntensityMV.set(currentIntensity + (targetIntensity - currentIntensity) * 0.15);

      // Sync Level Update (Based on Gathered Data Window)
      const distance = Math.abs(idealY - userY);
      // Balanced window for harmony (distance * 3.5 instead of 5.0)
      const proximity = Math.max(0, 100 - (distance * 3.5)); 
      
      harmonyHistoryRef.current.push(proximity);
      if (harmonyHistoryRef.current.length > MAX_HARMONY_HISTORY) {
        harmonyHistoryRef.current.shift();
      }
      
      const averageHarmony = harmonyHistoryRef.current.reduce((a, b) => a + b, 0) / harmonyHistoryRef.current.length;
      
      // Smoothly transition the sync level to the average harmony
      const currentSync = syncLevelMV.get();
      // Slower lerp for more stable, less volatile feedback (0.08 instead of 0.2)
      const lerpFactor = 0.08; 
      const nextSyncLevel = currentSync + (averageHarmony - currentSync) * lerpFactor;
      syncLevelMV.set(nextSyncLevel);
      
      // Track session-wide harmony for final report
      sessionHarmonyHistoryRef.current.push(nextSyncLevel);

      // Scoring (Throttled update to state)
      // Score Update (Progress Bar)
      // Only progress if harmony is high (70%+)
      if (idealY >= ceiling && idealY <= floor && nextSyncLevel > 70) {
        if (Math.random() > 0.9) { // Only update score state occasionally to save performance
          // Progress speed is now influenced by how perfect the harmony is
          const bonus = (nextSyncLevel - 70) / 30; // 0 to 1 bonus
          setScore(s => Math.min(100, s + (100 / (duration * 6)) * (1 + bonus))); 
        }
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [duration, getTechPhaseDuration, timerMV, gliderYMV, gliderScaleMV, userGliderScaleMV, userGliderYMV, syncLevelMV]);

  const startSession = useCallback(() => {
    userProgressRef.current = 0;
    setIsManualHold(false);
    setScore(0);
    setTimeLeft(duration);
    setGuideState('exhale');
    const now = Date.now();
    phaseStartTimeRef.current = now;
    lastFrameTimeRef.current = now;
    timerMV.set(0);
    gliderYMV.set(ceiling);
    userGliderYMV.set(ceiling);
    userProgressRef.current = 1;
    harmonyHistoryRef.current = [];
    sessionHarmonyHistoryRef.current = [];
    setShowUserGlider(true);
    setShowPathway(true);
    setShowFigure(true);
    setStatus('playing');
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  }, [animate, duration, floor, timerMV, gliderYMV, userGliderYMV]);

  useEffect(() => {
    if (status === 'playing') {
      startSession();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, startSession]);

  const handleRestart = () => {
    startSession();
  };

  // Countdown timer
  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const finalAvg = sessionHarmonyHistoryRef.current.length > 0
            ? sessionHarmonyHistoryRef.current.reduce((a, b) => a + b, 0) / sessionHarmonyHistoryRef.current.length
            : 100;
          setSessionAvgHarmony(finalAvg);
          setStatus('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const getGuideLabel = () => {
    const tech = selectedTech;
    if (tech.id === 'bhramari' && guideState === 'exhale') return 'HUMMING';
    if (tech.id === 'shitali' && guideState === 'inhale') return 'COOLING';
    if (tech.id === 'sheetkari' && guideState === 'inhale') return 'HISSING';
    if (tech.id === 'udgeeth' && guideState === 'exhale') return 'OM CHANT';
    if (tech.id === 'kapalabhati' || tech.id === 'bhastrika') {
      if (guideState === 'inhale') return 'PUMP IN';
      if (guideState === 'exhale') return 'SNAP OUT';
    }
    
    switch (guideState) {
      case 'inhale': return 'INHALE';
      case 'hold-in': return 'HOLD';
      case 'exhale': return 'EXHALE';
      case 'hold-out': return 'PAUSE';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const difficultyFactor = (duration - timeLeft) / duration;
  
  const nextTechnique = () => {
    const currentIndex = TECHNIQUES.findIndex(t => t.id === selectedTech.id);
    const nextIndex = (currentIndex + 1) % TECHNIQUES.length;
    setSelectedTech(TECHNIQUES[nextIndex]);
    setGuideState('exhale');
    timerMV.set(0);
    userProgressRef.current = 1;
  };

  const prevTechnique = () => {
    const currentIndex = TECHNIQUES.findIndex(t => t.id === selectedTech.id);
    const prevIndex = (currentIndex - 1 + TECHNIQUES.length) % TECHNIQUES.length;
    setSelectedTech(TECHNIQUES[prevIndex]);
    setGuideState('exhale');
    timerMV.set(0);
    userProgressRef.current = 1;
  };

  // Generate pathway points
  const pathwayPoints = useMemo(() => {
    const points = [];
    const totalPoints = 100;
    const cycleDurations = [selectedTech.exhale, selectedTech.holdOut, selectedTech.inhale, selectedTech.holdIn];
    const totalCycleTime = cycleDurations.reduce((a, b) => a + b, 0);
    
    for (let i = 0; i < totalPoints; i++) {
      const timeOffset = (i / totalPoints) * totalCycleTime;
      
      // Find which phase this time offset belongs to
      let accumulatedTime = 0;
      let phaseIndex = 0;
      let phaseTime = 0;
      
      for (let j = 0; j < 4; j++) {
        if (timeOffset < accumulatedTime + cycleDurations[j]) {
          phaseIndex = j;
          phaseTime = timeOffset - accumulatedTime;
          break;
        }
        accumulatedTime += cycleDurations[j];
      }
      
      const phaseProgress = cycleDurations[phaseIndex] > 0 ? phaseTime / cycleDurations[phaseIndex] : 0;
      const easedPhaseProgress = (1 - Math.cos(phaseProgress * Math.PI)) / 2;

      let y = 50;
      if (phaseIndex === 0) y = ceiling + (floor - ceiling) * easedPhaseProgress; // exhale
      else if (phaseIndex === 1) y = floor; // hold-out
      else if (phaseIndex === 2) y = floor - (floor - ceiling) * easedPhaseProgress; // inhale
      else y = ceiling; // hold-in

      points.push({ x: (i / totalPoints) * 100, y });
    }
    return points;
  }, [ceiling, floor, selectedTech]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 transition-colors duration-[5000ms] z-[100] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 dark:text-slate-200 overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)]",
        difficultyFactor < 0.3 ? "bg-gradient-to-b from-sky-100 via-indigo-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" :
        difficultyFactor < 0.7 ? "bg-gradient-to-b from-sky-200 via-indigo-100 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950" :
        "bg-gradient-to-b from-indigo-200 via-indigo-100 to-sky-50 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950"
      )}
    >
      {/* Back Button */}
      <button 
        onClick={onCancel}
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-[calc(1rem+env(safe-area-inset-left))] sm:top-[calc(2rem+env(safe-area-inset-top))] sm:left-[calc(2rem+env(safe-area-inset-left))] flex items-center gap-2 text-slate-400 hover:text-sky-500 transition-colors text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] group z-[60]"
        title="Back to Dashboard"
      >
        <div className="p-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg group-hover:bg-sky-50 dark:group-hover:bg-sky-900/30 transition-colors border border-white/60 dark:border-slate-700/60">
          <ChevronLeft className="w-3 h-3" />
        </div>
      </button>

      {/* Animated Clouds Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
        <motion.div 
          animate={{ x: [-100, 2000], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 60 - difficultyFactor * 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-0 w-64 h-32 bg-white dark:bg-sky-900 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ x: [2000, -100], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 80 - difficultyFactor * 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-60 right-0 w-96 h-40 bg-white dark:bg-indigo-900 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ x: [-200, 2000], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 100 - difficultyFactor * 50, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-40 left-0 w-80 h-32 bg-sky-200 dark:bg-slate-800 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-3xl w-full h-full flex flex-col items-center justify-between py-2 sm:py-4 relative z-10">
        <div className="space-y-0.5 sm:space-y-1 mb-0.5 sm:mb-1 shrink-0">
          <h2 className="text-xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2 sm:gap-3 text-indigo-900 dark:text-indigo-100">
            <Wind className={cn("text-sky-500 w-5 h-5 sm:w-7 h-7 transition-transform", difficultyFactor > 0.5 && "animate-pulse")} />
            Aura Glider
          </h2>
          
          {/* Yoga Master's Advice Overlay - Hidden on mobile, very compact on desktop */}
          <div className="hidden md:flex bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-1.5 max-w-md mx-auto items-center gap-2 text-left mt-0.5">
            <CheckCircle2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <p className="text-[9px] text-indigo-900/70 dark:text-indigo-100/80 leading-tight italic">
              "Practice seated with a straight spine. Balance, energize, and calm your system."
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-1 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl border border-white/50 dark:border-slate-700/50 gap-3 my-0.5 shadow-md shadow-indigo-100/5 dark:shadow-none w-full shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col text-left">
              <span className="text-[7px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest leading-none mb-0.5">Time</span>
              <span className="text-lg sm:text-xl font-black text-indigo-900 dark:text-indigo-100 tabular-nums leading-none">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <button 
            onClick={handleRestart}
            className="p-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-500 dark:text-indigo-400 hover:text-sky-500 transition-all shadow-sm group active:scale-95 shrink-0"
            title="Restart Exercise"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
          </button>

          <AnimatePresence>
            {showUserGlider && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 shrink-0"
              >
                <div className="flex flex-col items-start min-w-[100px]">
                  <span className="text-[8px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest leading-none mb-1">Harmony</span>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-100 leading-none">{Math.round(harmonyLevel)}%</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn(
                          "h-full transition-colors duration-500",
                          harmonyLevel > 90 ? "bg-sky-500" : 
                          harmonyLevel > 70 ? "bg-emerald-500" : 
                          harmonyLevel > 40 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${harmonyLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex-1 w-full min-h-[180px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-indigo-100/50 dark:shadow-none overflow-hidden my-1 sm:my-2">
          {/* Ceiling & Floor - Softened */}
          <div className="absolute top-0 w-full bg-indigo-500/5 dark:bg-indigo-400/5 border-b border-indigo-200/20 dark:border-indigo-800/20" style={{ height: `${ceiling}%` }} />
          <div className="absolute bottom-0 w-full bg-indigo-500/5 dark:bg-indigo-400/5 border-t border-indigo-200/20 dark:border-indigo-800/20" style={{ height: `${100 - floor}%` }} />

          {/* Pathway Visualization */}
          <AnimatePresence>
            {showPathway && (
              <motion.svg 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path 
                  d={`M ${pathwayPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-sky-400 dark:text-sky-500"
                  strokeDasharray="2,2"
                />
                {/* Moving indicator on pathway */}
                <motion.circle 
                  r="1"
                  className="fill-sky-400 dark:fill-sky-500"
                  style={{ cx: pathwayIndicatorCX, cy: pathwayIndicatorCY }}
                />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Mannequin Airflow Visualization */}
          {showFigure && (
            <Mannequin 
              state={guideState} 
              timerMV={timerMV}
              duration={getTechPhaseDuration(selectedTech, guideState)}
              techniqueId={selectedTech.id}
              cycleIndex={breathCycle}
            />
          )}

          {/* Glider - Zen Style */}
          <motion.div 
            className="absolute left-[40%] -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ 
              top: gliderYStyle,
              scale: gliderScaleMV
            }}
          >
            <div className="relative">
              {/* Breathing Halo */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-sky-400/20 dark:bg-sky-500/20 blur-xl -z-10"
                style={{ 
                  scale: breathingHaloScale,
                  opacity: breathingHaloOpacity
                }}
              />

              <Wind className={cn(
                "w-16 h-16 transition-colors duration-500",
                isOutOfBounds ? "text-rose-400" : isSyncHigh ? "text-sky-500" : "text-indigo-400 dark:text-indigo-600"
              )} />
              {isOutOfBounds && (
                <motion.div 
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-2 -right-2 text-rose-400"
                >
                  <AlertCircle className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* User Manual Glider (Orange) */}
          <AnimatePresence>
            {showUserGlider && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                style={{ 
                  top: userGliderYStyle,
                  scale: userGliderScaleMV
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  opacity: { duration: 0.3 },
                  x: { duration: 0.3 },
                }}
                className="absolute left-[60%] -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="relative">
                  {/* User Breathing Halo */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-orange-400/30 dark:bg-orange-500/30 blur-2xl -z-10"
                    style={{ 
                      scale: userHaloScale,
                      opacity: userHaloOpacity
                    }}
                  />

                  <Wind className={cn(
                    "w-16 h-16 text-orange-500 transition-colors duration-300",
                    isManualHold ? "opacity-100 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "opacity-80"
                  )} />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-orange-600 dark:text-orange-400 tracking-tighter whitespace-nowrap bg-white/80 dark:bg-slate-800/80 px-1 rounded shadow-sm border border-orange-100 dark:border-orange-900">
                    {isManualHold ? "HELD (SPACE)" : ""}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-8 items-center justify-center max-w-2xl mx-auto shrink-0 mt-4 sm:mt-8">
          {/* Yoga Guide & Technique Selector - Left */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                if (showPathway && showFigure) {
                  // Both ON -> Pattern Only
                  setShowFigure(false);
                } else if (showPathway && !showFigure) {
                  // Pattern Only -> Figure Only
                  setShowPathway(false);
                  setShowFigure(true);
                } else if (!showPathway && showFigure) {
                  // Figure Only -> Both OFF
                  setShowFigure(false);
                } else {
                  // Both OFF -> Both ON
                  setShowPathway(true);
                  setShowFigure(true);
                }
              }}
              className={cn(
                "w-[120px] h-[120px] sm:w-48 sm:h-48 rounded-full border-4 flex flex-col items-center justify-center text-[10px] font-black transition-all duration-500 mx-auto text-center p-1.5 sm:p-3 relative group hover:scale-105 active:scale-95",
                (showPathway && showFigure) 
                  ? "bg-sky-400/10 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500 shadow-[0_0_60px_rgba(56,189,248,0.3)]" 
                  : (showPathway || showFigure)
                    ? "bg-indigo-400/10 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500 shadow-[0_0_40px_rgba(129,140,248,0.2)]"
                    : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-800"
              )}
            >
              <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[6px] sm:text-[8px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-tighter leading-none">
                  {showPathway && showFigure ? "Full Guide" : 
                   showPathway ? "Pattern Only" : 
                   showFigure ? "Figure Only" : "No Guide"}
                </span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[14px] text-sky-500 dark:text-sky-300 font-black tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                  {selectedTech.inhale/1000}:{selectedTech.holdIn/1000}:{selectedTech.exhale/1000}:{selectedTech.holdOut/1000}
                </span>
                <motion.span 
                  key={guideState}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] sm:text-xs leading-tight text-indigo-900 dark:text-indigo-100 font-black uppercase tracking-widest px-1"
                >
                  {getGuideLabel()}
                </motion.span>
              </div>
              
              <div className="mt-2 w-16 h-1 bg-indigo-100 dark:bg-indigo-950 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500 dark:bg-indigo-600"
                  style={{ width: timerProgressWidth }}
                />
              </div>
              <div className="mt-1 text-[18px] font-black text-indigo-500 dark:text-indigo-300 tabular-nums bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full">
                <PhaseCountdown timerMV={timerMV} duration={getTechPhaseDuration(selectedTech, guideState)} />
              </div>
            </button>
          </div>

          {/* User Breath - Right */}
          <div className="flex flex-col items-center">
            <div className="relative mx-auto w-[120px] h-[120px] sm:w-48 sm:h-48">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setUserHolding(true);
                  userHoldingRef.current = true;
                  
                  const now = Date.now();
                  const diff = now - lastTapTimeRef.current;
                  
                  if (isManualHold) {
                    // Single tap to release hold
                    setIsManualHold(false);
                    isManualHoldRef.current = false;
                    lastTapTimeRef.current = 0;
                  } else if (diff < 400) {
                    // Double tap to enter sticky hold
                    setIsManualHold(true);
                    isManualHoldRef.current = true;
                    lastTapTimeRef.current = 0;
                  } else {
                    lastTapTimeRef.current = now;
                  }
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  setUserHolding(false);
                  userHoldingRef.current = false;
                }}
                onPointerCancel={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  setUserHolding(false);
                  userHoldingRef.current = false;
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={cn(
                  "w-full h-full rounded-full border-4 flex flex-col items-center justify-center text-[10px] font-black transition-all duration-300 relative overflow-hidden select-none touch-none hover:scale-105 active:scale-95 shadow-lg",
                  isManualHold ? "bg-amber-400/20 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500 shadow-[0_0_60px_rgba(251,191,36,0.3)]" :
                  userHolding 
                    ? "bg-sky-400/10 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500 shadow-[0_0_60px_rgba(56,189,248,0.3)]" 
                    : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-800"
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1">
                  <span className="text-[10px] sm:text-xs leading-tight text-indigo-900 dark:text-indigo-100 font-black uppercase tracking-widest px-1 sm:px-2 text-center">
                    {isManualHold ? "HELD" : (userHolding ? "INHALE" : "EXHALE")}
                  </span>
                  <div className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-md">
                    <span className="text-[7px] text-indigo-400 dark:text-indigo-300 font-black tracking-widest opacity-80 uppercase">
                      MANUAL
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 sm:mt-3 w-12 sm:w-20 h-1 bg-indigo-100 dark:bg-indigo-950 rounded-full overflow-hidden relative z-10">
                  <motion.div 
                    className="h-full bg-sky-500 dark:bg-sky-600"
                    animate={{ width: userHolding ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </button>

              {/* Glider Toggle Overlay */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserGlider(!showUserGlider);
                }}
                className={cn(
                  "absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all z-20 shadow-sm",
                  showUserGlider ? "bg-orange-500 text-white border-orange-600 shadow-orange-200/50" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                )}
              >
                {showUserGlider ? 'Glider On' : 'Glider Off'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto mt-2 sm:mt-4 px-4 shrink-0">
          <div className="flex items-center justify-center gap-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-2 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg">
            <button
              onClick={prevTechnique}
              className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-indigo-600 dark:text-indigo-400 shadow-sm group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="text-center px-4">
              <div className="text-[8px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mb-0.5">Technique</div>
              <div className="text-xs font-black text-indigo-900 dark:text-indigo-100 truncate max-w-[150px]">{selectedTech.name}</div>
            </div>
            <button
              onClick={nextTechnique}
              className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all text-indigo-600 dark:text-indigo-400 shadow-sm group"
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CheckCircle2 className="w-32 h-32 text-sky-400 dark:text-sky-300 mb-8 mx-auto" />
              <h3 className="text-5xl font-black mb-4 tracking-tight text-indigo-900 dark:text-indigo-100">Sanctuary Complete</h3>
              <div className="mb-8 p-6 bg-sky-50 dark:bg-sky-900/20 rounded-3xl border border-sky-100 dark:border-sky-800 inline-block min-w-[240px]">
                <p className="text-[10px] font-black text-sky-500 dark:text-sky-200 uppercase tracking-widest mb-1">Session Harmony</p>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-4xl font-black text-indigo-900 dark:text-indigo-100">
                    {sessionAvgHarmony !== null ? Math.round(sessionAvgHarmony) : 0}%
                  </p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn(
                        "h-full transition-colors duration-500",
                        (sessionAvgHarmony ?? 0) > 90 ? "bg-sky-500" : 
                        (sessionAvgHarmony ?? 0) > 70 ? "bg-emerald-500" : 
                        (sessionAvgHarmony ?? 0) > 40 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${sessionAvgHarmony ?? 0}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-300 mb-12 text-xl max-w-md mx-auto">
                {masteryAchieved 
                  ? "Exceptional mastery. You maintained perfect harmony even as the winds increased." 
                  : `You've dedicated ${Math.round(duration / 60)} minutes to your peace. Your mind is clear, your breath is steady.`}
              </p>
              <button 
                onClick={() => {
                  onComplete(sessionAvgHarmony ?? 100);
                }}
                className="px-16 py-5 bg-indigo-900 dark:bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl transition-all shadow-2xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95"
              >
                Return to World
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
