import { pipeline, env } from '@huggingface/transformers';

// Configure for local execution
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/'; // Models are in public/models/... served at /models/...
env.useBrowserCache = true;

let classifier: any = null;

self.onmessage = async (e) => {
  const { type, text } = e.data;

  if (type === 'init') {
    try {
      // Load from local path within the application
      classifier = await pipeline('sentiment-analysis', 'models/sentiment', {
        progress_callback: (data: any) => {
          self.postMessage({ type: 'progress', progress: data.progress, status: data.status });
        }
      });
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  }

  if (type === 'analyze') {
    if (!classifier) {
      self.postMessage({ type: 'error', error: 'Model not initialized' });
      return;
    }

    try {
      const results = await classifier(text);
      self.postMessage({ type: 'result', result: results[0] });
    } catch (error) {
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  }
};
