import React, { useCallback, useRef, useState } from 'react';
import './Knob.css';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  size?: number;
  label: string;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const Knob: React.FC<KnobProps> = ({
  value,
  min,
  max,
  step = 0.01,
  size = 60,
  label,
  unit = '',
  color = '#3498db',
  onChange,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startAngleRef = useRef(0);
  const startValueRef = useRef(0);

  // Convert value to angle (0-270 degrees, with -135 to +135 range)
  const valueToAngle = useCallback((val: number) => {
    const normalizedValue = (val - min) / (max - min);
    return -135 + (normalizedValue * 270);
  }, [min, max]);

  // Convert angle to value
  const angleToValue = useCallback((angle: number) => {
    const normalizedAngle = (angle + 135) / 270;
    const newValue = min + (normalizedAngle * (max - min));
    return Math.max(min, Math.min(max, newValue));
  }, [min, max]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    startAngleRef.current = valueToAngle(value);
    startValueRef.current = value;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!knobRef.current) return;

      const deltaY = moveEvent.clientY - e.clientY;
      const sensitivity = 0.5;
      const angleDelta = -deltaY * sensitivity;
      
      const newAngle = startAngleRef.current + angleDelta;
      const clampedAngle = Math.max(-135, Math.min(135, newAngle));
      
      const newValue = angleToValue(clampedAngle);
      const steppedValue = Math.round(newValue / step) * step;
      
      onChange(steppedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, onChange, step, disabled, valueToAngle, angleToValue]);

  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    const defaultValue = (min + max) / 2;
    onChange(defaultValue);
  }, [min, max, onChange, disabled]);

  const angle = valueToAngle(value);
  const displayValue = typeof value === 'number' ? value.toFixed(2) : '0.00';

  return (
    <div className="knob-container">
      <div className="knob-label">{label}</div>
      <div
        ref={knobRef}
        className={`knob ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        style={{
          width: size,
          height: size,
          '--knob-color': color
        } as React.CSSProperties}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="knob-body">
          <div 
            className="knob-indicator"
            style={{
              transform: `rotate(${angle}deg)`
            }}
          />
        </div>
        <div className="knob-center" />
      </div>
      <div className="knob-value">
        {displayValue}{unit}
      </div>
    </div>
  );
};

export default Knob;