import { memo, useCallback, useState, useEffect } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import PressureButton from './PressureButton';
import './PianoKeyboard.css';

interface PianoKeyboardProps {
  layerId: string;
}

interface Key {
  note: string;
  octave: number;
  type: 'white' | 'black';
  keyBinding?: string;
}

const PIANO_KEYS: Key[] = [
  { note: 'C', octave: 4, type: 'white', keyBinding: 'z' },
  { note: 'C#', octave: 4, type: 'black', keyBinding: 's' },
  { note: 'D', octave: 4, type: 'white', keyBinding: 'x' },
  { note: 'D#', octave: 4, type: 'black', keyBinding: 'd' },
  { note: 'E', octave: 4, type: 'white', keyBinding: 'c' },
  { note: 'F', octave: 4, type: 'white', keyBinding: 'v' },
  { note: 'F#', octave: 4, type: 'black', keyBinding: 'g' },
  { note: 'G', octave: 4, type: 'white', keyBinding: 'b' },
  { note: 'G#', octave: 4, type: 'black', keyBinding: 'h' },
  { note: 'A', octave: 4, type: 'white', keyBinding: 'n' },
  { note: 'A#', octave: 4, type: 'black', keyBinding: 'j' },
  { note: 'B', octave: 4, type: 'white', keyBinding: 'm' },
];

const PianoKeyboard: React.FC<PianoKeyboardProps> = memo(({ layerId }) => {
  const { engine } = useAudioEngine();
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [sustainedNotes, setSustainedNotes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const initializePiano = async () => {
      if (engine) {
        await engine.initialize();
        setIsInitialized(true);
      }
    };
    initializePiano();
  }, [engine]);

  // Note: Removed old playNote function - now using sustained note system exclusively

  // Keyboard handling using sustained note system
  useEffect(() => {
    const keyboardSustainMap = new Map<string, string>(); // Track active sustained notes by keyboard key

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = event.key.toLowerCase();
      const pianoKey = PIANO_KEYS.find(k => k.keyBinding === key);
      
      if (pianoKey && !activeKeys.has(key) && !keyboardSustainMap.has(key) && engine) {
        event.preventDefault();
        setActiveKeys(prev => new Set(prev).add(key));
        
        // Start sustained note for keyboard press
        const sustainId = engine.startSustainedNote(`${pianoKey.note}${pianoKey.octave}`, layerId, 0.7);
        keyboardSustainMap.set(key, sustainId);
        console.log(`⌨️ Keyboard started sustained piano note: ${pianoKey.note} with sustainId: ${sustainId}`);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const sustainId = keyboardSustainMap.get(key);
      
      if (sustainId && engine) {
        engine.stopSustainedNote(sustainId);
        keyboardSustainMap.delete(key);
        console.log(`⌨️ Keyboard stopped sustained piano note: ${key} (${sustainId})`);
      }
      
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      // Clean up any remaining sustained notes
      keyboardSustainMap.forEach((sustainId) => {
        if (engine) {
          engine.stopSustainedNote(sustainId);
        }
      });
      keyboardSustainMap.clear();
      
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [activeKeys, engine, layerId]);

  // Note: Using sustained note system for all piano interactions
  // The old handleKeyClick and handleKeyPressure functions have been replaced
  // with the pressure-sensitive sustained note callbacks below

  const handleSustainStart = useCallback((key: Key) => {
    return () => {
      // Start sustained piano note
      if (engine) {
        const sustainId = engine.startSustainedNote(`${key.note}${key.octave}`, layerId, 0.7);
        const keyId = `${key.note}${key.octave}`;
        setSustainedNotes(prev => new Map(prev).set(keyId, sustainId));
        console.log(`🎹 Started sustained piano note: ${keyId} with sustainId: ${sustainId}`);
        return sustainId;
      }
      return '';
    };
  }, [engine, layerId]);

  const handlePressureChange = useCallback((key: Key) => {
    return (pressure: number) => {
      // Modulate the sustained note based on pressure
      if (engine) {
        const keyId = `${key.note}${key.octave}`;
        const sustainId = sustainedNotes.get(keyId);
        if (sustainId) {
          engine.modulateSustainedNote(sustainId, pressure);
          console.log(`🎹 Modulating piano note ${keyId} (${sustainId}) with pressure: ${pressure.toFixed(3)}`);
        } else {
          console.log(`⚠️ No sustained note found for piano key: ${keyId}`);
        }
      }
    };
  }, [engine, sustainedNotes]);

  const handleSustainEnd = useCallback((key: Key) => {
    return (sustainId: string) => {
      // Stop sustained note
      if (engine && sustainId) {
        engine.stopSustainedNote(sustainId);
        const keyId = `${key.note}${key.octave}`;
        setSustainedNotes(prev => {
          const newMap = new Map(prev);
          newMap.delete(keyId);
          return newMap;
        });
        console.log(`🎹 Stopped sustained piano note: ${keyId} (${sustainId})`);
      }
    };
  }, [engine]);

  if (!isInitialized) {
    return (
      <div className="piano-keyboard loading">
        <div className="loading-spinner">Loading Piano...</div>
      </div>
    );
  }

  return (
    <div className="piano-keyboard">
      <h2 className="keyboard-title">Piano Keyboard</h2>
      <div className="keys-container">
        {PIANO_KEYS.map((key) => {
          const keyId = `${key.note}${key.octave}`;
          const isActive = key.keyBinding && activeKeys.has(key.keyBinding);
          
          return (
            <PressureButton
              key={keyId}
              className={`piano-key ${key.type} ${isActive ? 'active' : ''}`}
              onPress={(pressure) => {
                // INSTANT sound trigger - no delay, plays immediately on press
                if (engine) {
                  const sustainId = engine.startSustainedNote(`${key.note}${key.octave}`, layerId, pressure * 0.8);
                  // Stop immediately for click-like behavior but with sustained system
                  setTimeout(() => engine.stopSustainedNote(sustainId), 50);
                }
              }}
              onSustainStart={handleSustainStart(key)}
              onPressureChange={handlePressureChange(key)}
              onSustainEnd={handleSustainEnd(key)}
              maxPressure={1.0}
              minPressure={0.1}
              pressureCurve="logarithmic"
              visualFeedback={true}
              hapticFeedback={false} // Keep piano keys subtle
              onKeyDown={(event) => {
                if (key.keyBinding && event.key.toLowerCase() === key.keyBinding) {
                  event.preventDefault();
                  // INSTANT keyboard trigger
                  if (engine) {
                    const sustainId = engine.startSustainedNote(`${key.note}${key.octave}`, layerId, 0.7);
                    setTimeout(() => engine.stopSustainedNote(sustainId), 50);
                  }
                }
              }}
            >
              <span className="key-label">{key.note}</span>
              {key.keyBinding && (
                <span className="key-binding">{key.keyBinding.toUpperCase()}</span>
              )}
            </PressureButton>
          );
        })}
      </div>
      <div className="piano-controls">
        <div className="key-hints">
          Press Z-X-C-V-B-N-M for white keys, S-D-G-H-J for black keys
        </div>
      </div>
    </div>
  );
});

PianoKeyboard.displayName = 'PianoKeyboard';

export default PianoKeyboard;