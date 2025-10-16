import React, { memo, useCallback, useState, useEffect } from 'react';
import DrumPad from './DrumPad';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { DRUM_KIT } from '../audio/instruments';
import './DrumMachine.css';

interface DrumMachineProps {
  layerId: string;
}

const DRUM_PADS = [
  { id: 'kick', label: 'KICK', color: '#ff4444', key: 'q' },
  { id: 'snare', label: 'SNARE', color: '#44ff44', key: 'w' },
  { id: 'hihat', label: 'HI-HAT', color: '#4444ff', key: 'e' },
  { id: 'openhat', label: 'OPEN', color: '#ffff44', key: 'r' },
  { id: 'crash', label: 'CRASH', color: '#ff44ff', key: 'a' },
  { id: 'ride', label: 'RIDE', color: '#44ffff', key: 's' },
  { id: 'tom1', label: 'TOM1', color: '#ffa544', key: 'd' },
  { id: 'tom2', label: 'TOM2', color: '#a544ff', key: 'f' }
];

const DrumMachine: React.FC<DrumMachineProps> = memo(({ layerId }) => {
  const { playSample, loadSample, initialize } = useAudioEngine();
  const [isLoading, setIsLoading] = useState(true);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const handlePadTrigger = useCallback((padId: string, velocity: number) => {
    if (!isLoading) {
      playSample(padId, layerId, velocity);
    }
  }, [playSample, layerId, isLoading]);

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log('Initializing drum machine...');
        await initialize();
        
        // Load drum samples efficiently
        const loadPromises = Object.entries(DRUM_KIT.samples || {}).map(
          ([key, url]) => {
            console.log(`Loading drum sample: ${key} -> ${url}`);
            return loadSample(key, url);
          }
        );
        
        await Promise.allSettled(loadPromises);
        console.log('Drum machine samples loaded');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize drum machine:', error);
        setIsLoading(false);
      }
    };

    initializeAudio();
  }, [initialize, loadSample]);

  // Optimized keyboard handling with proper focus management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = event.key.toLowerCase();
      const pad = DRUM_PADS.find(p => p.key === key);
      
      if (pad && !activeKeys.has(key)) {
        event.preventDefault();
        setActiveKeys(prev => new Set(prev).add(key));
        handlePadTrigger(pad.id, 0.8);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    // Add focus management
    const handleFocus = () => {
      console.log('DrumMachine focused - keyboard controls active');
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeKeys, handlePadTrigger]);

  if (isLoading) {
    return (
      <div className="drum-machine loading">
        <div className="loading-spinner">Loading Drum Kit...</div>
      </div>
    );
  }

  return (
    <div className="drum-machine">
      <h2 className="machine-title">Electronic Drum Kit</h2>
      <div className="drum-grid">
        {DRUM_PADS.map(pad => (
          <DrumPad
            key={pad.id}
            id={pad.id}
            label={pad.label}
            color={pad.color}
            onTrigger={handlePadTrigger}
            disabled={isLoading}
          />
        ))}
      </div>
      <div className="controls">
        <div className="key-hints">
          {DRUM_PADS.map(pad => (
            <span key={pad.id} className="key-hint">
              {pad.key.toUpperCase()}: {pad.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

DrumMachine.displayName = 'DrumMachine';

export default DrumMachine;