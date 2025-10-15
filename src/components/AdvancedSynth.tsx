import { memo, useCallback, useState, useEffect } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { InstrumentConfig } from '../audio/instruments';
import PressureButton from './PressureButton';
import './AdvancedSynth.css';

interface AdvancedSynthProps {
  layerId: string;
  instrumentConfig: InstrumentConfig;
  onRemove?: () => void;
}

interface KeyboardKey {
  note: string;
  octave: number;
  type: 'white' | 'black';
  keyBinding?: string;
  frequency: number;
}

// Generate a full 2-octave keyboard
const generateKeyboard = (): KeyboardKey[] => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keys: KeyboardKey[] = [];
  const keyBindings = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'];
  
  for (let octave = 3; octave <= 4; octave++) {
    notes.forEach((note, index) => {
      const keyIndex = (octave - 3) * 12 + index;
      const keyBinding = keyIndex < keyBindings.length ? keyBindings[keyIndex] : undefined;
      
      keys.push({
        note,
        octave,
        type: note.includes('#') ? 'black' : 'white',
        keyBinding,
        frequency: 440 * Math.pow(2, ((octave - 4) * 12 + index - 9) / 12)
      });
    });
  }
  
  return keys;
};

const KEYBOARD_KEYS = generateKeyboard();

const AdvancedSynth: React.FC<AdvancedSynthProps> = memo(({ 
  layerId, 
  instrumentConfig, 
  onRemove 
}) => {
  const { engine } = useAudioEngine();
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentOctave, setCurrentOctave] = useState(3);

  useEffect(() => {
    const initializeSynth = async () => {
      // Always use the global instance to ensure consistency
      const globalEngine = (window as any).audioEngine || engine;
      if (globalEngine) {
        await globalEngine.initialize();
        setIsInitialized(true);
      }
    };
    initializeSynth();
  }, [engine]);

  const playNote = useCallback((frequency: number, velocity: number = 0.8) => {
    // Always use the global instance to ensure consistency
    const globalEngine = (window as any).audioEngine || engine;
    if (!globalEngine || !isInitialized) return;
    
    // Natural piano sound with proper sustain and release
    globalEngine.playAdvancedSynth(frequency, layerId, velocity, 'piano', {
      oscillator: { type: 'triangle' }, // Warmer than sine for piano
      envelope: { 
        attack: 0.01,   // Quick attack for responsiveness
        decay: 0.3,     // Natural decay
        sustain: 0.4,   // Moderate sustain
        release: 1.2    // Natural release like a real piano
      },
      filter: {
        frequency: 2000 + (velocity * 1500), // Brighter with harder playing
        type: 'lowpass',
        Q: 1
      }
    });
    
    const noteNameFromFreq = getNoteName(frequency);
    console.log(`🎹 AdvancedSynth played note: ${noteNameFromFreq} (${frequency.toFixed(2)}Hz) with velocity ${velocity.toFixed(3)}`);
  }, [engine, layerId, isInitialized, instrumentConfig]);

  // Helper function to convert frequency to note name
  const getNoteName = (frequency: number): string => {
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = ((semitonesFromA4 + 9) % 12 + 12) % 12; // +9 because A is at index 9
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    
    return `${notes[noteIndex]}${octave}`;
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = event.key.toLowerCase();
      const keyboardKey = KEYBOARD_KEYS.find(k => k.keyBinding === key);
      
      if (keyboardKey && !activeKeys.has(key)) {
        event.preventDefault();
        setActiveKeys(prev => new Set(prev).add(key));
        
        // Adjust frequency based on current octave
        const adjustedFrequency = keyboardKey.frequency * Math.pow(2, currentOctave - keyboardKey.octave);
        playNote(adjustedFrequency);
      }

      // Octave controls
      if (key === '-' || key === '_') {
        setCurrentOctave(prev => Math.max(1, prev - 1));
      } else if (key === '=' || key === '+') {
        setCurrentOctave(prev => Math.min(6, prev + 1));
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

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [activeKeys, playNote, currentOctave]);

  const handleKeyClick = useCallback((key: KeyboardKey) => {
    const adjustedFrequency = key.frequency * Math.pow(2, currentOctave - key.octave);
    playNote(adjustedFrequency);
  }, [playNote, currentOctave]);

  const handleKeyHover = useCallback((key: KeyboardKey) => {
    return (pressure: number) => {
      // Play note on hover with reduced velocity for subtle effect
      const adjustedFrequency = key.frequency * Math.pow(2, currentOctave - key.octave);
      const hoverVelocity = pressure * 0.6; // Reduce volume for hover
      playNote(adjustedFrequency, hoverVelocity);
    };
  }, [playNote, currentOctave]);

  const handleKeyPress = useCallback((key: KeyboardKey) => {
    return (pressure: number) => {
      // Play note with pressure-based velocity
      const adjustedFrequency = key.frequency * Math.pow(2, currentOctave - key.octave);
      const pressureVelocity = pressure * 0.8; // Full velocity for press
      playNote(adjustedFrequency, pressureVelocity);
    };
  }, [playNote, currentOctave]);

  const getInstrumentColor = () => {
    const colors = {
      bass: '#e74c3c',
      lead: '#f39c12',
      pad: '#3498db',
      strings: '#9b59b6',
      winds: '#1abc9c',
      synth: '#34495e',
      percussion: '#95a5a6'
    };
    return colors[instrumentConfig.type as keyof typeof colors] || '#34495e';
  };

  if (!isInitialized) {
    return (
      <div className="advanced-synth loading">
        <div className="loading-spinner">Loading {instrumentConfig.name}...</div>
      </div>
    );
  }

  return (
    <div 
      className="advanced-synth"
      style={{ '--instrument-color': getInstrumentColor() } as React.CSSProperties}
    >
      <div className="synth-header">
        <div className="instrument-info">
          <h3 className="instrument-title">{instrumentConfig.name}</h3>
          <span className="instrument-category">{instrumentConfig.type}</span>
        </div>
        <div className="synth-controls">
          <div className="octave-control">
            <button 
              onClick={() => setCurrentOctave(prev => Math.max(1, prev - 1))}
              className="octave-btn"
              disabled={currentOctave <= 1}
            >
              -
            </button>
            <span className="octave-display">Oct {currentOctave}</span>
            <button 
              onClick={() => setCurrentOctave(prev => Math.min(6, prev + 1))}
              className="octave-btn"
              disabled={currentOctave >= 6}
            >
              +
            </button>
          </div>
          {onRemove && (
            <button className="remove-synth-btn" onClick={onRemove}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="keyboard-container">
        <div className="keyboard">
          {KEYBOARD_KEYS.filter(key => key.type === 'white').map(key => {
            const isActive = key.keyBinding && activeKeys.has(key.keyBinding);
            return (
              <PressureButton
                key={`${key.note}${key.octave}`}
                className={`synth-key white ${isActive ? 'active' : ''}`}
                onPress={handleKeyPress(key)}
                onHover={handleKeyHover(key)}
                enableHoverPlay={true}
                visualFeedback={true}
                hapticFeedback={false}
                maxPressure={1.0}
                minPressure={0.1}
                pressureCurve="logarithmic"
              >
                <span className="key-note">{key.note}</span>
                {key.keyBinding && (
                  <span className="key-binding">{key.keyBinding.toUpperCase()}</span>
                )}
              </PressureButton>
            );
          })}
          {KEYBOARD_KEYS.filter(key => key.type === 'black').map(key => {
            const isActive = key.keyBinding && activeKeys.has(key.keyBinding);
            return (
              <PressureButton
                key={`${key.note}${key.octave}`}
                className={`synth-key black ${isActive ? 'active' : ''}`}
                onPress={handleKeyPress(key)}
                onHover={handleKeyHover(key)}
                enableHoverPlay={true}
                visualFeedback={true}
                hapticFeedback={false}
                maxPressure={1.0}
                minPressure={0.1}
                pressureCurve="logarithmic"
                style={{
                  left: `${(KEYBOARD_KEYS.filter(k => k.type === 'white' && k.note < key.note && k.octave === key.octave).length + 
                          (key.octave - 3) * 7) * 40 - 12}px`
                }}
              >
                <span className="key-note">{key.note}</span>
                {key.keyBinding && (
                  <span className="key-binding">{key.keyBinding.toUpperCase()}</span>
                )}
              </PressureButton>
            );
          })}
        </div>
      </div>

      <div className="synth-info">
        <div className="parameter-display">
          {instrumentConfig.synthParams && (
            <>
              <span className="param">
                OSC: {instrumentConfig.synthParams.oscillator.type}
              </span>
              <span className="param">
                ATK: {instrumentConfig.synthParams.envelope.attack}s
              </span>
              <span className="param">
                REL: {instrumentConfig.synthParams.envelope.release}s
              </span>
              {instrumentConfig.synthParams.filter && (
                <span className="param">
                  FILT: {instrumentConfig.synthParams.filter.frequency}Hz
                </span>
              )}
            </>
          )}
        </div>
        <div className="key-hints">
          Use keyboard keys • +/- for octave • Current: Oct {currentOctave}
        </div>
      </div>
    </div>
  );
});

AdvancedSynth.displayName = 'AdvancedSynth';

export default AdvancedSynth;