class OfflineAIService {
  private worker: Worker | null = null;
  private onReady: (() => void) | null = null;
  private onProgress: ((progress: number) => void) | null = null;
  private resolveAnalysis: ((result: any) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (e) => {
        const { type, progress, result, error } = e.data;
        
        switch (type) {
          case 'progress':
            if (this.onProgress) this.onProgress(progress || 0);
            break;
          case 'ready':
            if (this.onReady) this.onReady();
            break;
          case 'result':
            if (this.resolveAnalysis) this.resolveAnalysis(result);
            break;
          case 'error':
            console.error('Offline AI Worker Error:', error);
            if (this.resolveAnalysis) this.resolveAnalysis(null);
            break;
        }
      };
    }
  }

  async init(onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      this.onProgress = onProgress || null;
      this.onReady = () => resolve();
      this.worker?.postMessage({ type: 'init' });
    });
  }

  async analyzeSentiment(text: string): Promise<any> {
    return new Promise((resolve) => {
      this.resolveAnalysis = resolve;
      this.worker?.postMessage({ type: 'analyze', text });
    });
  }

  async generateStressPlan(eventTitle: string, stressLevel: number): Promise<any> {
    const sentiment = await this.analyzeSentiment(eventTitle);
    const isNegative = sentiment?.label === 'NEGATIVE' || stressLevel > 7;
    
    const plans = [
      {
        plan: `Focus on your center during ${eventTitle}. Use the Ocean Breath to maintain your internal rhythm.`,
        recommendedExercise: 'ujjayi',
        duration: 300
      },
      {
        plan: `For ${eventTitle}, grounding is key. Box breathing will stabilize your nervous system before you start.`,
        recommendedExercise: 'box',
        duration: 300
      },
      {
        plan: `Approach ${eventTitle} with a clear mind. The 4-7-8 technique will help release any pre-event tension.`,
        recommendedExercise: 'calm1',
        duration: 180
      }
    ];

    const index = isNegative ? 1 : (stressLevel > 4 ? 0 : 2);
    return plans[index];
  }

  async generateChatResponse(message: string, context?: any): Promise<string> {
    const sentiment = await this.analyzeSentiment(message);
    const logs = context?.logs || [];
    const lastLog = logs[logs.length - 1];
    const isStressed = (sentiment?.label === 'NEGATIVE' && sentiment?.score > 0.7) || (lastLog?.level > 60);

    if (isStressed) {
      return `I can feel the tension in your words. Let's take a moment to ground ourselves. I recommend trying the 1:2 Extended Exhale to signal safety to your body. [EXERCISE: calm]`;
    }

    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      return `Hello! I'm your Aura Guide. I'm monitoring your harmony levels and I'm here to help you stay balanced. How are you feeling right now?`;
    }

    if (message.toLowerCase().includes('game') || message.toLowerCase().includes('glider')) {
      return `The Glider Sanctuary is a great way to practice real-time harmony. Would you like to start a session now? [EXERCISE: box]`;
    }

    return `I understand. Maintaining awareness of your state is the first step toward balance. Would you like to try a quick breathing exercise to center yourself? [EXERCISE: dirga]`;
  }
}

export const offlineAI = new OfflineAIService();
