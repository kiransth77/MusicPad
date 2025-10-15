import { useCallback, useRef, useEffect } from 'react';
import { HighPerformanceAudioEngine } from '../audio/AudioEngine';

export const useAudioEngine = () => {
  const engineRef = useRef<HighPerformanceAudioEngine>();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!engineRef.current) {
      // Always get the same instance that App.tsx uses
      engineRef.current = HighPerformanceAudioEngine.getInstance();
    }
    
    return () => {
      // Don't dispose the shared instance, let it persist
      // if (engineRef.current) {
      //   engineRef.current.dispose();
      // }
    };
  }, []);

  const initialize = useCallback(async () => {
    if (!isInitialized.current && engineRef.current) {
      await engineRef.current.initialize();
      isInitialized.current = true;
    }
  }, []);

  const playSample = useCallback((sampleId: string, layerId: string, velocity?: number) => {
    if (engineRef.current && isInitialized.current) {
      engineRef.current.playSample(sampleId, layerId, velocity);
    }
  }, []);

  const loadSample = useCallback(async (id: string, url: string) => {
    if (engineRef.current) {
      await engineRef.current.loadSample(id, url);
    }
  }, []);

  return {
    initialize,
    playSample,
    loadSample,
    engine: engineRef.current
  };
};