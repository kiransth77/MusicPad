import * as Tone from 'tone';

export interface SampleConfig {
  name: string;
  frequency: number;
  duration: number;
  type: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom' | 'clap' | 'note';
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export class WAVGenerator {
  private static instance: WAVGenerator;
  private sampleRate: number = 44100;

  private constructor() {
    // Constructor ready for instance creation
  }

  static getInstance(): WAVGenerator {
    if (!WAVGenerator.instance) {
      WAVGenerator.instance = new WAVGenerator();
    }
    return WAVGenerator.instance;
  }

  // Generate synthetic drum samples
  async generateDrumSample(config: SampleConfig): Promise<ArrayBuffer> {
    const context = new Tone.OfflineContext(2, config.duration, this.sampleRate);
    Tone.setContext(context);

    let source: Tone.ToneAudioNode;
    let envelope: Tone.AmplitudeEnvelope;

    switch (config.type) {
      case 'kick':
        source = new Tone.Oscillator(config.frequency, 'sine');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.2,
          sustain: 0,
          release: 0.3
        });
        break;

      case 'snare':
        source = new Tone.Noise('white');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.1,
          sustain: 0,
          release: 0.2
        });
        break;

      case 'hihat':
        source = new Tone.Noise('white');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.05,
          sustain: 0,
          release: 0.05
        });
        break;

      case 'cymbal':
        source = new Tone.Noise('white');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.5,
          sustain: 0.2,
          release: 1.5
        });
        break;

      case 'tom':
        source = new Tone.Oscillator(config.frequency, 'sine');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.3,
          sustain: 0.1,
          release: 0.4
        });
        break;

      case 'clap':
        source = new Tone.Noise('white');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.05,
          sustain: 0,
          release: 0.1
        });
        break;

      default:
        source = new Tone.Oscillator(config.frequency, 'sine');
        envelope = new Tone.AmplitudeEnvelope(config.envelope || {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: 0.8
        });
    }

    // Add filtering for more realistic sounds
    const filter = new Tone.Filter(
      config.type === 'hihat' ? 8000 : 
      config.type === 'snare' ? 2000 : 
      config.type === 'kick' ? 100 : 1000, 
      'lowpass'
    );

    source.connect(envelope);
    envelope.connect(filter);
    filter.toDestination();

    // Start synthesis
    if (source instanceof Tone.Oscillator || source instanceof Tone.Noise) {
      source.start(0);
    }
    envelope.triggerAttackRelease(config.duration);

    // Render to buffer
    const toneBuffer = await context.render();
    
    // Convert ToneAudioBuffer to AudioBuffer
    const audioBuffer = toneBuffer.get() as AudioBuffer;
    
    // Convert to WAV format
    return this.bufferToWAV(audioBuffer);
  }

  // Generate a complete drum kit
  async generateDrumKit(): Promise<Map<string, ArrayBuffer>> {
    const drumSamples = new Map<string, ArrayBuffer>();

    const drumConfigs: SampleConfig[] = [
      { name: 'kick', frequency: 60, duration: 1, type: 'kick' },
      { name: 'snare', frequency: 200, duration: 0.5, type: 'snare' },
      { name: 'hihat', frequency: 8000, duration: 0.1, type: 'hihat' },
      { name: 'openhat', frequency: 6000, duration: 0.3, type: 'hihat' },
      { name: 'crash', frequency: 4000, duration: 2, type: 'cymbal' },
      { name: 'ride', frequency: 3000, duration: 1.5, type: 'cymbal' },
      { name: 'tom1', frequency: 120, duration: 0.8, type: 'tom' },
      { name: 'tom2', frequency: 80, duration: 0.9, type: 'tom' }
    ];

    for (const config of drumConfigs) {
      const wavBuffer = await this.generateDrumSample(config);
      drumSamples.set(config.name, wavBuffer);
    }

    return drumSamples;
  }

  // Generate musical note samples
  async generateNoteSample(note: string, octave: number, instrument: 'piano' | 'guitar' | 'violin' = 'piano'): Promise<ArrayBuffer> {
    const frequency = this.noteToFrequency(`${note}${octave}`);
    const context = new Tone.OfflineContext(2, 3, this.sampleRate);
    Tone.setContext(context);

    let source: Tone.Oscillator;
    let envelope: Tone.AmplitudeEnvelope;

    switch (instrument) {
      case 'piano':
        source = new Tone.Oscillator(frequency, 'sine');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.8,
          sustain: 0.2,
          release: 1.0
        });
        break;

      case 'guitar':
        source = new Tone.Oscillator(frequency, 'sawtooth');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.01,
          decay: 0.3,
          sustain: 0.4,
          release: 0.8
        });
        break;

      case 'violin':
        source = new Tone.Oscillator(frequency, 'sawtooth');
        envelope = new Tone.AmplitudeEnvelope({
          attack: 0.2,
          decay: 0.1,
          sustain: 0.8,
          release: 0.5
        });
        break;
    }

    const filter = new Tone.Filter(instrument === 'piano' ? 2000 : 1500, 'lowpass');
    
    source.connect(envelope);
    envelope.connect(filter);
    filter.toDestination();

    source.start(0);
    envelope.triggerAttackRelease(2.5);

    const toneBuffer = await context.render();
    const audioBuffer = toneBuffer.get() as AudioBuffer;
    return this.bufferToWAV(audioBuffer);
  }

  // Convert AudioBuffer to WAV format
  private bufferToWAV(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset + (i * numberOfChannels + channel) * 2, sample * 0x7FFF, true);
      }
    }

    return arrayBuffer;
  }

  // Download generated WAV file
  downloadWAV(arrayBuffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Create and download complete sample pack
  async createSamplePack(): Promise<void> {
    console.log('Generating drum kit samples...');
    const drumSamples = await this.generateDrumKit();

    // Download drum samples
    for (const [name, buffer] of drumSamples) {
      this.downloadWAV(buffer, `${name}.wav`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between downloads
    }

    console.log('Generating piano samples...');
    // Generate piano samples for different octaves
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    for (let octave = 3; octave <= 6; octave++) {
      for (const note of notes) {
        const buffer = await this.generateNoteSample(note, octave, 'piano');
        this.downloadWAV(buffer, `piano_${note}${octave}.wav`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log('Sample pack generation complete!');
  }

  private noteToFrequency(note: string): number {
    const noteMap: Record<string, number> = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53
    };
    return noteMap[note] || 440;
  }
}