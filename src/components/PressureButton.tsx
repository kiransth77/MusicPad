import React, { useState, useRef, useCallback, useEffect } from 'react';
import './PressureButton.css';

interface PressureButtonProps {
  children: React.ReactNode;
  onPress: (pressure: number) => void;
  onPressureChange?: (pressure: number) => void; // Continuous pressure updates
  onSustainStart?: () => string; // Returns sustain ID
  onSustainEnd?: (sustainId: string) => void;
  onRelease?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  maxPressure?: number;
  minPressure?: number;
  pressureCurve?: 'linear' | 'exponential' | 'logarithmic';
  visualFeedback?: boolean;
  hapticFeedback?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onHover?: (pressure: number) => void; // Hover-to-play functionality
  enableHoverPlay?: boolean; // Enable hover-based playing
}

const PressureButton: React.FC<PressureButtonProps> = ({
  children,
  onPress,
  onPressureChange,
  onSustainStart,
  onSustainEnd,
  onRelease,
  className = '',
  style = {},
  disabled = false,
  maxPressure = 1.0,
  minPressure = 0.1,
  pressureCurve = 'exponential',
  visualFeedback = true,
  hapticFeedback = true,
  onKeyDown,
  onHover,
  enableHoverPlay = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [, setPressureHistory] = useState<number[]>([]);
  const [sustainId, setSustainId] = useState<string>('');
  const [isMouseDown, setIsMouseDown] = useState(false); // Track global mouse state
  const buttonRef = useRef<HTMLButtonElement>(null);
  const startTimeRef = useRef<number>(0);
  const startPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pressureAnimationRef = useRef<number>();
  const hoverTimeoutRef = useRef<number>();

  // Calculate pressure based on multiple factors
  const calculatePressure = useCallback((event: MouseEvent | TouchEvent, startTime: number, startPos: { x: number; y: number }) => {
    const now = Date.now();
    const duration = now - startTime;
    
    let currentPos = { x: 0, y: 0 };
    let force = 0;

    if ('touches' in event && event.touches.length > 0) {
      // Touch event - use touch pressure if available
      const touch = event.touches[0];
      currentPos = { x: touch.clientX, y: touch.clientY };
      force = (touch as any).force || 0.5; // Use pressure API if available
    } else if ('clientX' in event) {
      // Mouse event
      currentPos = { x: event.clientX, y: event.clientY };
      force = (event as any).pressure || 0.5; // Some mice support pressure
    }

    // Calculate movement distance (less movement = more focused pressure)
    const distance = Math.sqrt(
      Math.pow(currentPos.x - startPos.x, 2) + 
      Math.pow(currentPos.y - startPos.y, 2)
    );

    // Pressure factors:
    // 1. Duration (longer hold = more pressure, up to a point)
    const durationFactor = Math.min(duration / 500, 1) * 0.3; // Max 0.3 from duration
    
    // 2. Movement stability (less movement = more pressure)
    const stabilityFactor = Math.max(0, 1 - (distance / 50)) * 0.3; // Max 0.3 from stability
    
    // 3. Device force (if available)
    const forceFactor = force * 0.4; // Max 0.4 from actual pressure
    
    // Combine factors
    let rawPressure = durationFactor + stabilityFactor + forceFactor + minPressure;
    
    // Apply pressure curve
    switch (pressureCurve) {
      case 'exponential':
        rawPressure = Math.pow(rawPressure, 1.5);
        break;
      case 'logarithmic':
        rawPressure = Math.log(rawPressure + 1) / Math.log(2);
        break;
      // 'linear' - no transformation
    }

    // Clamp to range
    return Math.max(minPressure, Math.min(maxPressure, rawPressure));
  }, [maxPressure, minPressure, pressureCurve]);

  const handleStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsPressed(true);
    startTimeRef.current = Date.now();
    
    if ('touches' in event.nativeEvent && event.nativeEvent.touches.length > 0) {
      const touch = event.nativeEvent.touches[0];
      startPositionRef.current = { x: touch.clientX, y: touch.clientY };
    } else if ('clientX' in event.nativeEvent) {
      startPositionRef.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
    }

    // INSTANT audio trigger - call onPress immediately with initial pressure
    const initialPressure = Math.max(minPressure, 0.7); // Start with decent pressure
    onPress(initialPressure);

    // Haptic feedback
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Start sustained note if callback is provided
    let currentSustainId = '';
    if (onSustainStart) {
      currentSustainId = onSustainStart();
      setSustainId(currentSustainId);
    }

    // Start pressure monitoring
    const monitorPressure = () => {
      const event = new MouseEvent('mousemove');
      const pressure = calculatePressure(
        event, 
        startTimeRef.current, 
        startPositionRef.current
      );
      
      setCurrentPressure(pressure);
      setPressureHistory(prev => [...prev.slice(-20), pressure]); // Keep last 20 samples
      
      // Continuous pressure updates for real-time modulation
      if (onPressureChange) {
        onPressureChange(pressure);
      }
      
      if (isPressed) {
        pressureAnimationRef.current = requestAnimationFrame(monitorPressure);
      }
    };

    pressureAnimationRef.current = requestAnimationFrame(monitorPressure);

    // Immediate press with minimum pressure (for backwards compatibility)
    onPress(minPressure);
  }, [disabled, calculatePressure, minPressure, onPress, hapticFeedback, isPressed]);

  const handleEnd = useCallback(() => {
    if (!isPressed) return;
    
    setIsPressed(false);
    
    if (pressureAnimationRef.current) {
      cancelAnimationFrame(pressureAnimationRef.current);
    }

    // End sustained note if callback is provided
    if (onSustainEnd && sustainId) {
      onSustainEnd(sustainId);
      setSustainId('');
    }

    // Final press with current pressure
    onPress(currentPressure);
    
    if (onRelease) {
      onRelease();
    }

    // Reset state
    setTimeout(() => {
      setCurrentPressure(0);
      setPressureHistory([]);
    }, 100);
  }, [isPressed, currentPressure, onPress, onRelease, onSustainEnd, sustainId]);

  // Handle hover-to-play functionality
  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    if (disabled || !enableHoverPlay) return;
    
    setIsHovered(true);
    
    // Check if mouse is down globally (dragging across keys)
    if (event.buttons === 1 || isMouseDown) {
      const hoverPressure = Math.max(minPressure, 0.6); // Medium pressure for hover
      if (onHover) {
        onHover(hoverPressure);
      }
      
      // Visual feedback for hover
      if (visualFeedback) {
        setCurrentPressure(hoverPressure * 0.7); // Subtle visual feedback
      }
      
      // Auto-clear hover pressure after a short time
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = window.setTimeout(() => {
        if (!isPressed) {
          setCurrentPressure(0);
        }
      }, 150); // Hover effect lasts 150ms
    }
  }, [disabled, enableHoverPlay, isMouseDown, minPressure, onHover, visualFeedback, isPressed]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    // Clear hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Reset pressure if not actively pressed
    if (!isPressed) {
      setCurrentPressure(0);
    }
  }, [isPressed]);

  // Track global mouse state for drag-to-play
  useEffect(() => {
    const handleGlobalMouseDown = () => setIsMouseDown(true);
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    
    document.addEventListener('mousedown', handleGlobalMouseDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Handle pressure updates during press
  useEffect(() => {
    if (isPressed && currentPressure > minPressure) {
      onPress(currentPressure);
    }
  }, [currentPressure, isPressed, minPressure, onPress]);

  // Global event listeners for mouse/touch end
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isPressed) {
        handleEnd();
      }
    };

    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('touchcancel', handleGlobalEnd);

    return () => {
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, [isPressed, handleEnd]);

  // Calculate visual feedback properties
  const pressureIntensity = currentPressure / maxPressure;
  const scaleTransform = 1 - (pressureIntensity * 0.1); // Button gets slightly smaller with pressure
  const brightness = 1 + (pressureIntensity * 0.5); // Button gets brighter with pressure

  return (
    <button
      ref={buttonRef}
      className={`pressure-button ${className} ${isPressed ? 'pressed' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        ...style,
        transform: `scale(${scaleTransform})`,
        filter: visualFeedback ? `brightness(${brightness}) saturate(${1 + pressureIntensity})` : undefined,
        '--pressure-intensity': pressureIntensity,
        '--current-pressure': currentPressure
      } as React.CSSProperties}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={onKeyDown}
      disabled={disabled}
    >
      {children}
      
      {visualFeedback && isPressed && (
        <div className="pressure-indicator">
          <div 
            className="pressure-bar"
            style={{
              height: `${pressureIntensity * 100}%`,
              backgroundColor: `hsl(${120 * pressureIntensity}, 80%, 50%)`
            }}
          />
          <div className="pressure-value">
            {Math.round(currentPressure * 100)}
          </div>
        </div>
      )}
      
      {/* Pressure ripple effect */}
      {visualFeedback && isPressed && (
        <div 
          className="pressure-ripple"
          style={{
            transform: `scale(${pressureIntensity * 2})`,
            opacity: pressureIntensity * 0.3
          }}
        />
      )}
    </button>
  );
};

export default PressureButton;