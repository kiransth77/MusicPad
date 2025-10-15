import React, { memo, useCallback, useState } from 'react';
import PressureButton from './PressureButton';
import './DrumPad.css';

interface DrumPadProps {
  id: string;
  label: string;
  color: string;
  onTrigger: (padId: string, velocity: number) => void;
  disabled?: boolean;
}

const DrumPad: React.FC<DrumPadProps> = memo(({ 
  id, 
  label, 
  color, 
  onTrigger, 
  disabled = false 
}) => {
  const handlePressure = useCallback((pressure: number) => {
    if (!disabled) {
      // Enhanced pressure mapping for drums
      // Map pressure (0.1-1.0) to drum velocity with curve
      const velocity = Math.pow(pressure, 0.8); // Slight curve for more natural feel
      onTrigger(id, velocity);
    }
  }, [id, onTrigger, disabled]);

  const handleSustainStart = useCallback(() => {
    if (disabled) return '';
    // Start sustained drum sound
    const engine = (window as any).audioEngine;
    if (engine && engine.startSustainedDrum) {
      const sustainId = engine.startSustainedDrum(id, 'drums', 0.7);
      setCurrentSustainId(sustainId);
      console.log(`🥁 Started sustained drum: ${id} with sustainId: ${sustainId}`);
      return sustainId;
    }
    return '';
  }, [id, disabled]);

  const [currentSustainId, setCurrentSustainId] = useState<string>('');

  const handlePressureChange = useCallback((pressure: number) => {
    if (disabled) return;
    // Modulate the sustained drum based on pressure
    const engine = (window as any).audioEngine;
    if (engine && engine.modulateSustainedNote && currentSustainId) {
      engine.modulateSustainedNote(currentSustainId, pressure);
      console.log(`🥁 Modulating drum ${id} (${currentSustainId}) with pressure: ${pressure.toFixed(3)}`);
    } else {
      console.log(`⚠️ No sustained drum found for ${id} or missing sustainId: ${currentSustainId}`);
    }
  }, [id, disabled, currentSustainId]);

  const handleSustainEnd = useCallback((sustainId: string) => {
    if (disabled) return;
    // Stop sustained drum sound
    const engine = (window as any).audioEngine;
    if (engine && engine.stopSustainedNote) {
      engine.stopSustainedNote(sustainId);
      setCurrentSustainId('');
      console.log(`🥁 Stopped sustained drum: ${id} (${sustainId})`);
    }
  }, [disabled, id]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      if (!disabled) {
        onTrigger(id, 0.8);
      }
    }
  }, [id, onTrigger, disabled]);

  return (
    <PressureButton
      className={`drum-pad ${disabled ? 'disabled' : ''}`}
      style={{ '--pad-color': color } as React.CSSProperties}
      onPress={handlePressure}
      onPressureChange={handlePressureChange}
      onSustainStart={handleSustainStart}
      onSustainEnd={handleSustainEnd}
      disabled={disabled}
      maxPressure={1.0}
      minPressure={0.1}
      pressureCurve="exponential"
      visualFeedback={true}
      hapticFeedback={true}
      onKeyDown={handleKeyDown}
    >
      <span className="pad-label">{label}</span>
    </PressureButton>
  );
});

DrumPad.displayName = 'DrumPad';

export default DrumPad;