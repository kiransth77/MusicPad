import React, { useState } from 'react';
import { WAVGenerator } from '../audio/WAVGenerator';
import styles from './WAVGeneratorPanel.module.css';

interface WAVGeneratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WAVGeneratorPanel: React.FC<WAVGeneratorPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const handleGenerateKit = async () => {
    setIsGenerating(true);
    setProgress('Initializing WAV generator...');
    
    try {
      const generator = WAVGenerator.getInstance();
      setProgress('Generating drum samples...');
      
      // Generate individual drum samples
      const drumTypes = [
        { name: 'kick', frequency: 60, duration: 1, type: 'kick' as const },
        { name: 'snare', frequency: 200, duration: 0.5, type: 'snare' as const },
        { name: 'hihat', frequency: 8000, duration: 0.1, type: 'hihat' as const },
        { name: 'openhat', frequency: 6000, duration: 0.3, type: 'hihat' as const },
        { name: 'crash', frequency: 4000, duration: 2, type: 'cymbal' as const },
        { name: 'ride', frequency: 3000, duration: 1.5, type: 'cymbal' as const },
        { name: 'tom1', frequency: 120, duration: 0.8, type: 'tom' as const },
        { name: 'tom2', frequency: 80, duration: 0.9, type: 'tom' as const }
      ];

      for (let i = 0; i < drumTypes.length; i++) {
        const drum = drumTypes[i];
        setProgress(`Generating ${drum.name}... (${i + 1}/${drumTypes.length})`);
        const buffer = await generator.generateDrumSample(drum);
        generator.downloadWAV(buffer, `${drum.name}.wav`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setProgress('Drum kit generation complete!');
      setTimeout(() => setProgress(''), 2000);
    } catch (error) {
      console.error('Error generating drum kit:', error);
      setProgress('Error generating samples');
      setTimeout(() => setProgress(''), 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePiano = async () => {
    setIsGenerating(true);
    setProgress('Generating piano samples...');
    
    try {
      const generator = WAVGenerator.getInstance();
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const octaves = [3, 4, 5, 6];
      let count = 0;
      const total = notes.length * octaves.length;

      for (const octave of octaves) {
        for (const note of notes) {
          count++;
          setProgress(`Generating ${note}${octave}... (${count}/${total})`);
          const buffer = await generator.generateNoteSample(note, octave, 'piano');
          generator.downloadWAV(buffer, `piano_${note}${octave}.wav`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setProgress('Piano samples generation complete!');
      setTimeout(() => setProgress(''), 2000);
    } catch (error) {
      console.error('Error generating piano samples:', error);
      setProgress('Error generating samples');
      setTimeout(() => setProgress(''), 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateGuitar = async () => {
    setIsGenerating(true);
    setProgress('Generating guitar samples...');
    
    try {
      const generator = WAVGenerator.getInstance();
      const notes = ['E', 'A', 'D', 'G', 'B', 'E']; // Guitar tuning
      const frets = [0, 2, 3, 5, 7, 9, 12]; // Common fret positions
      let count = 0;
      const total = notes.length * frets.length;

      for (let string = 0; string < notes.length; string++) {
        for (const fret of frets) {
          count++;
          const note = notes[string];
          const octave = string < 4 ? 3 : 4; // Lower strings are lower octave
          setProgress(`Generating string ${string + 1} fret ${fret}... (${count}/${total})`);
          const buffer = await generator.generateNoteSample(note, octave, 'guitar');
          generator.downloadWAV(buffer, `guitar_string${string + 1}_fret${fret}.wav`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setProgress('Guitar samples generation complete!');
      setTimeout(() => setProgress(''), 2000);
    } catch (error) {
      console.error('Error generating guitar samples:', error);
      setProgress('Error generating samples');
      setTimeout(() => setProgress(''), 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>WAV Sample Generator</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.description}>
            <p>Generate high-quality WAV samples programmatically using synthetic audio generation.</p>
            <p>All samples are created using pure synthesis - no external audio files required!</p>
          </div>

          <div className={styles.generators}>
            <div className={styles.generatorSection}>
              <h3>Drum Kit Samples</h3>
              <p>Generate a complete drum kit with kick, snare, hi-hats, cymbals, and toms.</p>
              <button 
                className={styles.generateButton}
                onClick={handleGenerateKit}
                disabled={isGenerating}
              >
                Generate Drum Kit (8 samples)
              </button>
            </div>

            <div className={styles.generatorSection}>
              <h3>Piano Samples</h3>
              <p>Generate piano notes across multiple octaves (C3-B6).</p>
              <button 
                className={styles.generateButton}
                onClick={handleGeneratePiano}
                disabled={isGenerating}
              >
                Generate Piano Samples (28 samples)
              </button>
            </div>

            <div className={styles.generatorSection}>
              <h3>Guitar Samples</h3>
              <p>Generate guitar samples for 6 strings across common fret positions.</p>
              <button 
                className={styles.generateButton}
                onClick={handleGenerateGuitar}
                disabled={isGenerating}
              >
                Generate Guitar Samples (42 samples)
              </button>
            </div>
          </div>

          {progress && (
            <div className={styles.progress}>
              <div className={styles.progressText}>{progress}</div>
              {isGenerating && <div className={styles.progressBar}></div>}
            </div>
          )}

          <div className={styles.notes}>
            <h4>Notes:</h4>
            <ul>
              <li>Generated WAV files will automatically download to your default download folder</li>
              <li>Each sample is generated at 44.1kHz, 16-bit quality</li>
              <li>Samples are created using advanced synthesis techniques</li>
              <li>Generation may take a few moments depending on your system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};