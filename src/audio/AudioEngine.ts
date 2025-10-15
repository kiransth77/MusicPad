import * as Tone from 'tone';

export interface AudioLayer {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: string[];
}

export class HighPerformanceAudioEngine {
  private static instance: HighPerformanceAudioEngine;
  private context: Tone.Context;
  private masterGain: Tone.Gain;
  private limiter: Tone.Limiter;
  private layers: Map<string, AudioLayer> = new Map();
  private activeSources: Map<string, Tone.ToneAudioNode[]> = new Map();
  private bufferPool: Map<string, Tone.ToneAudioBuffer> = new Map();
  private globalInstrumentVolume: number = 0.5;
  
  private constructor() {
    // Use low-latency settings
    this.context = new Tone.Context({
      latencyHint: 'interactive',
      lookAhead: 0.01,
      updateInterval: 0.01
    });
    
    Tone.setContext(this.context);
    
    // Master chain with minimal processing - MAXIMUM AUDIBLE VOLUME
    this.masterGain = new Tone.Gain(2.0); // Increased to 2.0 for audible output
    this.limiter = new Tone.Limiter(-0.1);
    
    this.masterGain.connect(this.limiter);
    this.limiter.toDestination();
    
    console.log('🔊 Audio engine constructor completed');
    console.log('🔊 Master gain initialized to:', this.masterGain.gain.value);
    console.log('🔊 Audio routing: MasterGain -> Limiter -> Destination');
    console.log('🔊 Destination context:', Tone.getDestination().context.state);
    
    // Make instance globally accessible to prevent multiple instances during hot reload
    if (typeof window !== 'undefined') {
      (window as any).__audioEngineInstance = this;
    }
  }

  static getInstance(): HighPerformanceAudioEngine {
    // Check global instance first (for hot reload stability)
    if (typeof window !== 'undefined' && (window as any).__audioEngineInstance) {
      HighPerformanceAudioEngine.instance = (window as any).__audioEngineInstance;
      console.log('🔄 Using existing AudioEngine instance from global window');
    }
    
    if (!HighPerformanceAudioEngine.instance) {
      HighPerformanceAudioEngine.instance = new HighPerformanceAudioEngine();
      console.log('🆕 Created new AudioEngine instance');
      
      // Make testing methods globally accessible for debugging
      if (typeof window !== 'undefined') {
        (window as any).audioTesting = {
          testScale: (layerId?: string, octave?: number) => 
            HighPerformanceAudioEngine.instance.testScaleAccuracy(layerId, octave),
          testNote: (note: string, octave: number, layerId?: string) => 
            HighPerformanceAudioEngine.instance.testNoteAccuracy(note, octave, layerId),
          testChromatic: (startNote?: string, steps?: number, layerId?: string) => 
            HighPerformanceAudioEngine.instance.testChromaticScale(startNote, steps, layerId),
          testIntervals: (rootNote?: string, layerId?: string) => 
            HighPerformanceAudioEngine.instance.testIntervals(rootNote, layerId),
          verifyPitch: (expectedFreq: number, actualNote: string, layerId?: string) => 
            HighPerformanceAudioEngine.instance.verifyPitch(expectedFreq, actualNote, layerId),
          playFreq: (freq: number, layerId?: string) => 
            HighPerformanceAudioEngine.instance.playAdvancedSynth(freq, layerId || 'piano', 0.7, 'synth')
        };
        
        console.log('🎼 Audio testing tools available globally:');
        console.log('  audioTesting.testScale() - Test full chromatic scale');
        console.log('  audioTesting.testNote("C", 4) - Test specific note');
        console.log('  audioTesting.testChromatic() - Test chromatic progression');
        console.log('  audioTesting.testIntervals() - Test harmonic intervals');
        console.log('  audioTesting.verifyPitch(440, "A4") - Compare frequencies');
        console.log('  audioTesting.playFreq(440) - Play specific frequency');
        
        // Initialize audio repair worker
        (async () => {
          try {
            const AudioRepairWorker = await import('./AudioRepairWorker');
            if (!(window as any).__audioRepairWorker) {
              (window as any).__audioRepairWorker = new AudioRepairWorker.default({
                enabled: true,
                checkInterval: 2000,
                maxRetries: 5,
                retryDelay: 1000
              });
              console.log('🔧 AudioRepairWorker initialized and monitoring audio health');
            }
          } catch (error) {
            console.warn('🔧 Failed to initialize AudioRepairWorker:', error);
          }
        })();
      }
    }
    return HighPerformanceAudioEngine.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Starting audio engine initialization...');
      
      // Ensure we're running in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Audio engine requires browser environment');
      }
      
      // Start Tone.js and resume audio context
      await Tone.start();
      console.log('Tone.js started successfully');
      
      // Force resume the audio context
      if (this.context.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await this.context.resume();
      }
      
      // Verify audio context is ready
      if (this.context.state !== 'running') {
        console.warn('Audio context is not in running state:', this.context.state);
      }
      
      console.log('Audio engine initialized successfully');
      console.log('Audio context state:', this.context.state);
      console.log('Audio context sample rate:', this.context.sampleRate);
      
      // Test with a simple beep to verify audio works
      this.testAudioOutput();
      
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  // Test method to verify audio output is working
  private testAudioOutput(): void {
    try {
      console.log('🔊 Testing audio output...');
      
      // Test direct connection to destination first
      console.log('🔊 Testing DIRECT connection to speakers...');
      const directTestOsc = new Tone.Oscillator(440, 'sine');
      const directTestGain = new Tone.Gain(0.1);
      
      directTestOsc.connect(directTestGain);
      directTestGain.toDestination(); // Direct to speakers, bypassing our chain
      
      directTestOsc.start();
      directTestOsc.stop('+0.1');
      
      setTimeout(() => {
        directTestOsc.dispose();
        directTestGain.dispose();
        console.log('🔊 Direct test completed');
        
        // Now test through our master chain
        this.testThroughMasterChain();
      }, 200);
      
    } catch (error) {
      console.error('❌ Audio test failed:', error);
    }
  }

  private testThroughMasterChain(): void {
    try {
      console.log('🔊 Testing through MASTER CHAIN...');
      const testOsc = new Tone.Oscillator(880, 'sine'); // Higher pitch to distinguish
      const testEnv = new Tone.AmplitudeEnvelope({
        attack: 0.01,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      });
      const testGain = new Tone.Gain(0.2); // Louder for master chain test
      
      testOsc.chain(testEnv, testGain, this.masterGain);
      
      console.log('🔊 Starting test oscillator...');
      testOsc.start();
      testEnv.triggerAttackRelease(0.1);
      
      console.log('🔊 Test audio should be playing now for 200ms');
      
      // Clean up after test
      setTimeout(() => {
        testOsc.dispose();
        testEnv.dispose();
        testGain.dispose();
        console.log('🔊 Audio test completed and cleaned up');
      }, 200);
      
    } catch (error) {
      console.error('❌ Audio test failed:', error);
    }
  }

  // Public method to test audio manually
  public testAudio(): void {
    console.log('🔊 Manual audio test requested');
    console.log('🔊 Audio context state:', this.context.state);
    console.log('🔊 Master gain value:', this.masterGain.gain.value);
    console.log('🔊 Destination connected:', this.limiter.output.numberOfOutputs);
    
    this.testAudioOutput();
  }

  // Method to refresh audio routing - call this if audio stops working
  public refreshAudioRouting(): void {
    console.log('🔄 Refreshing audio routing...');
    
    // First, diagnose the current state
    this.diagnoseAudioState();
    
    try {
      // Force resume audio context if needed
      if (this.context.state !== 'running') {
        console.log('🔄 Resuming audio context...');
        this.context.resume();
      }
      
      // Disconnect everything
      this.masterGain.disconnect();
      this.limiter.disconnect();
      
      // Reconnect the chain
      this.masterGain.connect(this.limiter);
      this.limiter.toDestination();
      
      console.log('✅ Audio routing refreshed successfully');
      console.log('🔊 New routing: MasterGain -> Limiter -> Browser Speakers');
      
      // Test after refresh
      setTimeout(() => this.testAudio(), 100);
      
    } catch (error) {
      console.error('❌ Failed to refresh audio routing:', error);
    }
  }

  private diagnoseAudioState(): void {
    console.log('🔍 === AUDIO DIAGNOSIS ===');
    console.log('🔊 Audio Context State:', this.context.state);
    console.log('🔊 Sample Rate:', this.context.sampleRate);
    console.log('🔊 Current Time:', this.context.currentTime);
    console.log('🔊 Master Gain Value:', this.masterGain.gain.value);
    console.log('🔊 Master Gain Connected:', this.masterGain.numberOfOutputs > 0);
    console.log('🔊 Limiter Connected:', this.limiter.numberOfOutputs > 0);
    console.log('🔊 Tone Destination:', Tone.getDestination());
    console.log('🔊 Browser AudioContext Available:', typeof window !== 'undefined' && 'AudioContext' in window);
    console.log('🔍 === END DIAGNOSIS ===');
  }

  // Public method to get audio context state for debugging
  getContextState(): string {
    return this.context?.state || 'unknown';
  }

  // Public method to get loaded samples for debugging
  getLoadedSamples(): string[] {
    return Array.from(this.bufferPool.keys());
  }

  // Public method to get layer info for debugging
  getLayersInfo(): Array<{id: string, name: string, volume: number, muted: boolean}> {
    return Array.from(this.layers.entries()).map(([id, layer]) => ({
      id,
      name: layer.name,
      volume: layer.volume,
      muted: layer.muted
    }));
  }

  // Public method to check audio connectivity
  checkAudioChain(): void {
    console.log('🔍 === AUDIO CHAIN DIAGNOSTIC ===');
    console.log('🔊 Audio Context State:', this.context.state);
    console.log('🔊 Audio Context Sample Rate:', this.context.sampleRate);
    console.log('🔊 Master Gain Value:', this.masterGain.gain.value);
    console.log('🔊 Master Gain Outputs:', this.masterGain.numberOfOutputs);
    console.log('🔊 Limiter Outputs:', this.limiter.numberOfOutputs);
    console.log('🔊 Destination Connected:', this.limiter.output.numberOfOutputs > 0);
    console.log('🔊 Available Samples:', this.getLoadedSamples());
    console.log('🔊 Available Layers:', this.getLayersInfo());
    console.log('🔍 === END DIAGNOSTIC ===');
  }

  // Force play a test sound directly to destination
  forceTestSound(): void {
    console.log('🔊 FORCE TEST SOUND - Direct to destination');
    try {
      const testOsc = new Tone.Oscillator(440, 'sine');
      const testGain = new Tone.Gain(0.3);
      
      testOsc.connect(testGain);
      testGain.toDestination(); // Direct to destination, bypassing master chain
      
      testOsc.start();
      console.log('🔊 Direct test sound started - should be audible!');
      
      setTimeout(() => {
        testOsc.stop();
        testOsc.dispose();
        testGain.dispose();
        console.log('🔊 Direct test sound stopped');
      }, 500);
      
    } catch (error) {
      console.error('❌ Force test sound failed:', error);
    }
  }

  // Get master gain for recording
  getMasterGain(): Tone.Gain {
    return this.masterGain;
  }

  // Create and return a recorder connected to master output
  createRecorder(): Tone.Recorder {
    const recorder = new Tone.Recorder();
    this.masterGain.connect(recorder);
    console.log('🎙️ Created recorder connected to master gain');
    return recorder;
  }

  // Preload common drum samples
  async preloadDrumSamples(): Promise<void> {
    const drumSamples = [
      { id: 'kick', url: '/samples/kick.wav' },
      { id: 'snare', url: '/samples/snare.wav' },
      { id: 'hihat', url: '/samples/hihat.wav' },
      { id: 'openhat', url: '/samples/openhat.wav' },
      { id: 'crash', url: '/samples/crash.wav' },
      { id: 'ride', url: '/samples/ride.wav' },
      { id: 'tom1', url: '/samples/tom1.wav' },
      { id: 'tom2', url: '/samples/tom2.wav' }
    ];

    console.log('Preloading drum samples...');
    const loadPromises = drumSamples.map(sample => this.loadSample(sample.id, sample.url));
    await Promise.allSettled(loadPromises);
    
    console.log(`Loaded ${this.bufferPool.size} samples successfully`);
    console.log('Available samples:', Array.from(this.bufferPool.keys()));
  }

  // Create synthetic drum sounds using oscillators and noise
  private createDrumSound(type: string): Tone.ToneAudioNode {
    switch (type) {
      case 'kick':
        const kickOsc = new Tone.Oscillator(60, 'sine');
        return kickOsc;
      case 'snare':
      case 'hihat':
      case 'openhat':
      case 'crash':
        const noise = new Tone.Noise('white');
        return noise;
      case 'ride':
        const rideOsc = new Tone.Oscillator(800, 'triangle');
        return rideOsc;
      case 'tom1':
        const tom1Osc = new Tone.Oscillator(120, 'sine');
        return tom1Osc;
      case 'tom2':
        const tom2Osc = new Tone.Oscillator(80, 'sine');
        return tom2Osc;
      default:
        const defaultOsc = new Tone.Oscillator(440, 'sine');
        return defaultOsc;
    }
  }

  // Optimized sample loading (fallback to synthetic sounds)
  async loadSample(id: string, url: string): Promise<void> {
    if (!this.bufferPool.has(id)) {
      try {
        console.log(`Loading sample: ${id} from ${url}`);
        const buffer = new Tone.ToneAudioBuffer();
        await buffer.load(url);
        
        if (buffer.loaded && buffer.length > 0) {
          this.bufferPool.set(id, buffer);
          console.log(`Successfully loaded sample: ${id}`);
        } else {
          throw new Error(`Buffer loaded but is empty for ${id}`);
        }
      } catch (error) {
        console.warn(`Failed to load sample ${id} from ${url}:`, error);
        console.log(`Using synthetic sound for ${id} (audio file not found)`);
        // Mark as failed/synthetic sound - don't store null, just don't add to pool
        // this.bufferPool.set(id, null as any);
      }
    }
  }

  // Zero-allocation sample playback with synthetic fallback
  playSample(sampleId: string, layerId: string, velocity: number = 1): void {
    console.log(`🎵 playSample called: ${sampleId} on layer ${layerId} with velocity ${velocity}`);
    
    try {
      // Check if layer exists and is not muted
      const layer = this.layers.get(layerId);
      if (!layer) {
        console.warn(`❌ Layer ${layerId} not found`);
        return;
      }
      if (layer.muted) {
        console.warn(`🔇 Layer ${layerId} is muted`);
        return;
      }
      console.log(`✅ Layer ${layerId} found and not muted`);
      
      // Ensure audio context is running
      console.log(`🔊 Audio context state: ${this.context.state}`);
      if (this.context.state === 'suspended') {
        console.log('🔄 Audio context suspended, attempting to resume...');
        this.context.resume().then(() => {
          console.log('🔄 Audio context resumed, retrying sample playback');
          this.playSampleInternal(sampleId, layerId, velocity);
        });
        return;
      }
      
      if (this.context.state !== 'running') {
        console.warn(`⚠️ Audio context not running, state: ${this.context.state}`);
        // Try to force start
        console.log('🔄 Attempting to start Tone.js...');
        Tone.start().then(() => {
          console.log('🔄 Tone.js started, retrying sample playback');
          this.playSampleInternal(sampleId, layerId, velocity);
        });
        return;
      }
      
      console.log('✅ Audio context is running, proceeding with playback');
      this.playSampleInternal(sampleId, layerId, velocity);
    } catch (error) {
      console.error('❌ Error in playSample:', error);
      // Always try synthetic fallback
      console.log('🔄 Attempting synthetic fallback...');
      this.playSyntheticDrum(sampleId, velocity);
    }
  }

  private playSampleInternal(sampleId: string, layerId: string, velocity: number): void {
    console.log(`🎵 playSampleInternal: ${sampleId} on ${layerId}`);
    
    const layer = this.layers.get(layerId);
    if (!layer || layer.muted) {
      console.warn(`❌ Layer check failed in playSampleInternal`);
      return;
    }

    const buffer = this.bufferPool.get(sampleId);
    console.log(`🎵 Buffer lookup for ${sampleId}:`, buffer ? 'found' : 'not found');
    
    // TEMPORARY: Force synthetic sounds to debug audio issue
    console.log(`🎵 FORCING synthetic sound for ${sampleId} (debugging mode)`);
    this.playSyntheticDrum(sampleId, velocity * layer.volume);
    return;
    
    if (buffer && buffer.loaded) {
      console.log(`🎵 Using loaded sample for ${sampleId}`);
      // Use loaded sample
      try {
        const player = new Tone.Player(buffer);
        const gainNode = new Tone.Gain(velocity * (layer?.volume || 0.5));
        
        console.log(`🎵 Created player and gain node. Final volume: ${velocity * (layer?.volume || 0.5)}`);
        
        player.chain(gainNode, this.masterGain);
        console.log(`🎵 Audio chain connected: Player -> Gain -> Master`);
        
        player.start();
        console.log(`🔊 Sample ${sampleId} started playing!`);
        
        // Auto-dispose after playing
        player.onstop = () => {
          console.log(`🎵 Sample ${sampleId} stopped, disposing resources`);
          player.dispose();
          gainNode.dispose();
        };
        
        // Force disposal after a reasonable time (in case onstop doesn't fire)
        setTimeout(() => {
          if (!player.disposed) {
            console.log(`🎵 Force disposing ${sampleId} after timeout`);
            player.dispose();
            gainNode.dispose();
          }
        }, 5000);
        
      } catch (error) {
        console.error(`❌ Error playing sample ${sampleId}:`, error);
        // Fallback to synthetic sound
        console.log(`🔄 Falling back to synthetic sound for ${sampleId}`);
        this.playSyntheticDrum(sampleId, velocity * (layer?.volume || 0.5));
      }
    } else {
      // Use synthetic sound
      console.log(`🎵 Using synthetic sound for ${sampleId} (no buffer or not loaded)`);
      this.playSyntheticDrum(sampleId, velocity * (layer?.volume || 0.5));
    }
  }

  private playSyntheticDrum(drumType: string, volume: number): void {
    try {
      console.log(`🥁 Playing synthetic drum: ${drumType} with volume: ${volume}`);
      console.log(`🔊 Master gain value: ${this.masterGain.gain.value}`);
      
      const source = this.createDrumSound(drumType);
      console.log(`🥁 Created sound source for ${drumType}:`, source.constructor.name);
      
      const envelope = new Tone.AmplitudeEnvelope({
        attack: 0.01,
        decay: drumType === 'kick' ? 0.2 : drumType.includes('hat') ? 0.05 : 0.1,
        sustain: 0,
        release: drumType === 'kick' ? 0.3 : drumType.includes('hat') ? 0.02 : 0.2
      });

      const gain = new Tone.Gain(Math.min(volume * 0.5, 0.8)); // Increased volume
      console.log(`🥁 Final gain value: ${gain.gain.value}`);
      
      source.connect(envelope);
      envelope.connect(gain);
      gain.connect(this.masterGain);
      console.log(`🔗 Audio chain: ${source.constructor.name} -> Envelope -> Gain -> Master`);
      
      // Add filter for more realistic sound
      if (drumType.includes('hat') || drumType === 'snare') {
        const filter = new Tone.Filter(drumType === 'snare' ? 2000 : 8000, 'highpass');
        envelope.disconnect();
        envelope.connect(filter);
        filter.connect(gain);
        console.log(`🔗 Added filter to chain for ${drumType}`);
      }
      
      // Start the source (works for both Oscillator and Noise)
      if (source instanceof Tone.Oscillator || source instanceof Tone.Noise) {
        source.start();
        console.log(`🔊 Started ${source.constructor.name} for ${drumType}`);
      }
      
      envelope.triggerAttackRelease('8n');
      console.log(`🔊 Triggered envelope for ${drumType} - SOUND SHOULD BE PLAYING NOW!`);
      
      // Check if audio is actually connected to destination
      console.log(`🔊 Master gain connected outputs: ${this.masterGain.numberOfOutputs}`);
      console.log(`🔊 Limiter connected to destination: ${this.limiter.output.numberOfOutputs}`);
      
      // Cleanup
      setTimeout(() => {
        if (!source.disposed) source.dispose();
        if (!envelope.disposed) envelope.dispose();
        if (!gain.disposed) gain.dispose();
        console.log(`🧹 Cleaned up resources for ${drumType}`);
      }, 1000);
      
    } catch (error) {
      console.error(`❌ Error playing synthetic drum ${drumType}:`, error);
    }
  }

  // Store active sustained notes for real-time modulation
  private sustainedNotes: Map<string, {
    source: Tone.Oscillator | Tone.Noise;
    envelope: Tone.AmplitudeEnvelope;
    gain: Tone.Gain;
    filter: Tone.Filter;
    layerId: string;
    baseVolume: number;
    baseFrequency?: number;
  }> = new Map();

  // Play synthetic musical notes
  playSyntheticNote(note: string, layerId: string, velocity: number = 1): void {
    const layer = this.layers.get(layerId);
    if (!layer || layer.muted) return;

    const frequency = this.noteToFrequency(note);
    const osc = new Tone.Oscillator(frequency, 'sine');
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.001, // INSTANT attack for immediate response
      decay: 0.1,
      sustain: 0.6,
      release: 0.2  // Shorter release
    });

    const gain = new Tone.Gain(velocity * layer.volume * 0.3);
    
    osc.connect(envelope);
    envelope.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    envelope.triggerAttackRelease('4n');
    
    // Cleanup
    setTimeout(() => {
      osc.dispose();
      envelope.dispose();
      gain.dispose();
    }, 2000);
  }

  // Start a sustained note that can be modulated in real-time
  startSustainedNote(note: string, layerId: string, initialVelocity: number = 0.7): string {
    const layer = this.layers.get(layerId);
    if (!layer || layer.muted) return '';

    const noteId = `${layerId}-${note}-${Date.now()}`;
    const frequency = this.noteToFrequency(note);
    
    console.log(`🎹 Starting sustained note: ${note} at ${frequency}Hz with velocity ${initialVelocity}`);
    
    // Create audio chain with filter for dynamic modulation
    const oscillator = new Tone.Oscillator(frequency, 'sine');
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.001, // INSTANT attack for immediate response
      decay: 0.05,
      sustain: 0.9, // High sustain for continuous play
      release: 0.1  // Quick release when stopped
    });
    const gain = new Tone.Gain(initialVelocity * layer.volume * 0.4);
    const filter = new Tone.Filter({
      frequency: 2000 + (initialVelocity * 2000), // Dynamic filter based on pressure
      type: 'lowpass',
      rolloff: -24
    });
    
    // Connect the audio chain
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(gain);
    gain.connect(this.masterGain);
    
    // Start the oscillator and trigger sustain
    oscillator.start();
    envelope.triggerAttack(); // IMMEDIATE trigger
    
    // Store for real-time modulation
    this.sustainedNotes.set(noteId, {
      source: oscillator,
      envelope,
      gain,
      filter,
      layerId,
      baseVolume: layer.volume * 0.4,
      baseFrequency: frequency
    });
    
    console.log(`🎹 Sustained note ${noteId} started and stored for modulation`);
    return noteId;
  }

  // Modulate a sustained note based on pressure changes
  modulateSustainedNote(noteId: string, pressure: number): void {
    const note = this.sustainedNotes.get(noteId);
    if (!note) return;

    const layer = this.layers.get(note.layerId);
    if (!layer) return;

    // Dynamic volume based on pressure (0.1 to 1.0)
    const dynamicVolume = Math.max(0.1, Math.min(1.0, pressure)) * note.baseVolume * layer.volume;
    note.gain.gain.setValueAtTime(dynamicVolume, Tone.now());
    
    // Dynamic filter cutoff based on pressure (200Hz to 4000Hz)
    const filterFreq = 200 + (pressure * 3800);
    note.filter.frequency.setValueAtTime(filterFreq, Tone.now());
    
    // Add slight oscillator frequency modulation for intensity (only for oscillators)
    if (note.source instanceof Tone.Oscillator && note.baseFrequency) {
      const pitchMod = note.baseFrequency * (1 + (pressure - 0.5) * 0.02); // Slight pitch bend
      note.source.frequency.setValueAtTime(pitchMod, Tone.now());
    }
    
    console.log(`🎛️ Modulating note ${noteId}: volume=${dynamicVolume.toFixed(3)}, filter=${filterFreq.toFixed(0)}Hz, pressure=${pressure.toFixed(3)}`);
  }

  // Stop a sustained note
  stopSustainedNote(noteId: string): void {
    const note = this.sustainedNotes.get(noteId);
    if (!note) return;

    console.log(`🔚 Stopping sustained note: ${noteId}`);
    
    // Trigger release
    note.envelope.triggerRelease();
    
    // Cleanup after release
    setTimeout(() => {
      if (!note.source.disposed) note.source.dispose();
      if (!note.envelope.disposed) note.envelope.dispose();
      if (!note.gain.disposed) note.gain.dispose();
      if (!note.filter.disposed) note.filter.dispose();
      this.sustainedNotes.delete(noteId);
      console.log(`🧹 Cleaned up sustained note: ${noteId}`);
    }, 500);
  }

  // Start sustained drum with real-time modulation
  startSustainedDrum(drumType: string, layerId: string, initialVelocity: number = 0.7): string {
    const layer = this.layers.get(layerId);
    if (!layer || layer.muted) return '';

    const drumId = `${layerId}-${drumType}-${Date.now()}`;
    
    console.log(`🥁 Starting sustained drum: ${drumType} with velocity ${initialVelocity}`);
    
    // Create appropriate oscillator/noise for drum type
    let source: Tone.Oscillator | Tone.Noise;
    let baseFreq: number | undefined;
    
    if (drumType === 'kick') {
      source = new Tone.Oscillator(60, 'sine'); // Low frequency for kick
      baseFreq = 60;
    } else if (drumType === 'snare') {
      source = new Tone.Noise('white'); // White noise for snare
    } else if (drumType.includes('hat')) {
      source = new Tone.Noise('white'); // High frequency noise for hats
    } else {
      source = new Tone.Oscillator(200, 'triangle'); // Mid frequency for toms
      baseFreq = 200;
    }
    
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.1,
      sustain: 0.6, // Higher sustain for continuous play
      release: 0.2
    });
    
    const gain = new Tone.Gain(initialVelocity * layer.volume * 0.5);
    const filter = new Tone.Filter({
      frequency: 1000 + (initialVelocity * 2000),
      type: 'lowpass'
    });
    
    // Connect audio chain
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(gain);
    gain.connect(this.masterGain);
    
    // Start source and envelope
    source.start();
    envelope.triggerAttack();
    
    // Store for modulation
    this.sustainedNotes.set(drumId, {
      source,
      envelope,
      gain,
      filter,
      layerId,
      baseVolume: layer.volume * 0.5,
      baseFrequency: baseFreq
    });
    
    console.log(`🥁 Sustained drum ${drumId} started and stored for modulation`);
    return drumId;
  }

  // Convert note name to frequency (enhanced version with octave support)
  private noteToFrequency(note: string): number {
    // First check if it's a simple note (for backward compatibility)
    const simpleNoteMap: Record<string, number> = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
    };
    
    if (simpleNoteMap[note]) {
      return simpleNoteMap[note];
    }
    
    // Enhanced parsing for full note format
    const noteRegex = /^([A-G]#?)(\d+)$/;
    const match = note.match(noteRegex);
    
    if (!match) {
      console.warn(`Invalid note format: ${note}, using A4 (440Hz)`);
      return 440;
    }
    
    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr);
    
    // Note names to semitone offsets from C
    const noteOffsets: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    const semitoneOffset = noteOffsets[noteName];
    if (semitoneOffset === undefined) {
      console.warn(`Unknown note name: ${noteName}, using A4 (440Hz)`);
      return 440;
    }
    
    // Calculate frequency using A4 = 440Hz as reference
    // A4 is 9 semitones above C4
    const A4_FREQ = 440;
    const C4_FREQ = A4_FREQ * Math.pow(2, -9/12); // C4 frequency
    
    // Calculate semitones from C4
    const semitonesFromC4 = (octave - 4) * 12 + semitoneOffset;
    
    // Calculate final frequency
    const frequency = C4_FREQ * Math.pow(2, semitonesFromC4 / 12);
    
    console.log(`🎵 ${note} -> ${frequency.toFixed(2)}Hz (${semitonesFromC4} semitones from C4)`);
    return frequency;
  }

  // Advanced synthesis for different instrument types
  playAdvancedSynth(frequency: number, layerId: string, velocity: number, instrumentType: string, synthParams?: any): void {
    try {
      // Ensure audio context is running
      if (this.context.state === 'suspended') {
        console.log('Audio context suspended, attempting to resume...');
        this.context.resume().then(() => {
          this.playAdvancedSynthInternal(frequency, layerId, velocity, instrumentType, synthParams);
        });
        return;
      }
      
      this.playAdvancedSynthInternal(frequency, layerId, velocity, instrumentType, synthParams);
    } catch (error) {
      console.error('Error playing advanced synth:', error);
    }
  }

  private playAdvancedSynthInternal(frequency: number, layerId: string, velocity: number, instrumentType: string, synthParams?: any): void {
    console.log(`🎹 playAdvancedSynth called: ${instrumentType} on layer ${layerId} with frequency ${frequency.toFixed(2)}Hz`);
    
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.log(`❌ Layer ${layerId} not found`);
      console.log(`🔍 Available layers:`, Array.from(this.layers.keys()));
      console.log(`🔍 Total layers count:`, this.layers.size);
      return;
    }
    if (layer.muted) {
      console.log(`🔇 Layer ${layerId} is muted`);
      return;
    }
    
    console.log(`✅ Layer ${layerId} found and not muted`);
    console.log(`🔊 Audio context state: ${this.context.state}`);

    const params = synthParams || {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.8 }
    };

    let osc: Tone.Oscillator | Tone.Noise;
    
    // Create oscillator based on instrument type
    switch (instrumentType) {
      case 'piano':
        // Natural piano-like synthesis with triangle wave + harmonics
        osc = new Tone.Oscillator(frequency, 'triangle');
        break;
      case 'bass':
        osc = new Tone.Oscillator(frequency / 2, params.oscillator.type); // Sub-bass
        break;
      case 'lead':
        osc = new Tone.Oscillator(frequency, params.oscillator.type);
        break;
      case 'pad':
        osc = new Tone.Oscillator(frequency, params.oscillator.type);
        break;
      case 'strings':
        osc = new Tone.Oscillator(frequency, 'sawtooth');
        break;
      case 'winds':
        osc = new Tone.Oscillator(frequency, 'sine');
        break;
      default:
        osc = new Tone.Oscillator(frequency, params.oscillator.type);
    }

    const envelope = new Tone.AmplitudeEnvelope({
      attack: params.envelope.attack,
      decay: params.envelope.decay,
      sustain: params.envelope.sustain,
      release: params.envelope.release
    });

    const finalVolume = velocity * layer.volume * this.globalInstrumentVolume;
    const gain = new Tone.Gain(finalVolume);
    console.log(`🎹 Playing ${instrumentType}: frequency=${frequency.toFixed(2)}Hz, volume=${finalVolume.toFixed(3)}`);
    console.log(`🎛️ Volume calculation: velocity(${velocity.toFixed(2)}) × layer(${layer.volume.toFixed(2)}) × global(${this.globalInstrumentVolume.toFixed(2)}) = ${finalVolume.toFixed(3)}`);
    console.log(`🔊 Master gain value: ${this.masterGain.gain.value}`);
    
    // Add instrument-specific effects
    let effectChain: Tone.ToneAudioNode = envelope;
    
    if (params.filter) {
      const filter = new Tone.Filter(params.filter.frequency, params.filter.type || 'lowpass');
      filter.Q.value = params.filter.Q;
      envelope.connect(filter);
      effectChain = filter;
    }
    
    // Add modulation for certain instruments
    if (params.modulation && (instrumentType === 'strings' || instrumentType === 'winds')) {
      const lfo = new Tone.LFO(params.modulation.frequency);
      if (params.modulation.type === 'vibrato') {
        lfo.connect(osc.frequency);
        lfo.start();
      }
    }
    
    console.log(`🎹 Created sound source for ${instrumentType}: ${osc.constructor.name}`);
    
    osc.connect(envelope);
    effectChain.connect(gain);
    gain.connect(this.masterGain);
    
    console.log(`🔗 Audio chain: ${osc.constructor.name} -> Envelope -> Gain -> Master`);
    
    osc.start();
    console.log(`🔊 Started ${osc.constructor.name} for ${instrumentType}`);
    
    // Determine note duration based on instrument type - piano gets natural sustain
    const duration = instrumentType === 'piano' ? '1n' : // Full note for piano
                    instrumentType === 'pad' ? '2n' : 
                    instrumentType === 'bass' ? '4n' : '8n';
    envelope.triggerAttackRelease(duration);
    console.log(`🔊 Triggered envelope for ${instrumentType} - SOUND SHOULD BE PLAYING NOW!`);
    
    console.log(`🔊 Master gain connected outputs: ${this.masterGain.numberOfOutputs}`);
    console.log(`🔊 Limiter connected to destination: ${this.limiter.numberOfOutputs}`);
    
    // Cleanup with appropriate timing - piano needs longer time for natural release
    const cleanupTime = instrumentType === 'piano' ? 6000 : // 6 seconds for piano natural decay
                       instrumentType === 'pad' ? 4000 : 2000;
    setTimeout(() => {
      console.log(`🧹 Cleaned up resources for ${instrumentType}`);
      osc.dispose();
      envelope.dispose();
      gain.dispose();
      if (effectChain !== envelope) {
        effectChain.dispose();
      }
    }, cleanupTime);
  }

  // Efficient layer management
  addLayer(layer: AudioLayer): void {
    console.log(`➕ Adding layer: ${layer.name} (id: ${layer.id})`);
    this.layers.set(layer.id, layer);
    this.activeSources.set(layer.id, []);
    console.log(`✅ Layer added. Total layers: ${this.layers.size}`);
  }

  hasLayer(layerId: string): boolean {
    return this.layers.has(layerId);
  }

  updateLayerVolume(layerId: string, volume: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.volume = volume;
    }
  }

  toggleLayerMute(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.muted = !layer.muted;
    }
  }

  // Memory-efficient cleanup
  clearLayer(layerId: string): void {
    const sources = this.activeSources.get(layerId);
    if (sources) {
      sources.forEach(source => source.dispose());
      sources.length = 0;
    }
  }

  // Real-time audio settings control methods
  updateMasterGain(gain: number): void {
    this.masterGain.gain.value = gain;
    console.log(`🎛️ Master gain updated to: ${gain}`);
  }

  updateGlobalInstrumentVolume(volume: number): void {
    this.globalInstrumentVolume = volume;
    console.log(`🎛️ Global instrument volume updated to: ${volume}`);
  }

  updateLimiterThreshold(threshold: number): void {
    this.limiter.threshold.value = threshold;
    console.log(`🎛️ Limiter threshold updated to: ${threshold} dB`);
  }

  getMasterGainValue(): number {
    return this.masterGain.gain.value;
  }

  getLimiterThreshold(): number {
    return this.limiter.threshold.value;
  }

  // Scale testing system for pitch accuracy verification
  public testScaleAccuracy(layerId: string = 'piano', octave: number = 4): void {
    console.log(`🎼 === SCALE ACCURACY TEST ===`);
    console.log(`🎹 Testing ${layerId} layer, octave ${octave}`);
    
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const expectedFrequencies = this.getExpectedFrequencies(octave);
    
    let noteIndex = 0;
    const playNext = () => {
      if (noteIndex >= chromatic.length) {
        console.log(`🎼 Scale test completed for octave ${octave}`);
        console.log(`🎼 === END SCALE TEST ===`);
        return;
      }
      
      const note = chromatic[noteIndex];
      const noteWithOctave = `${note}${octave}`;
      const expectedFreq = expectedFrequencies[note];
      
      console.log(`🎵 Testing: ${noteWithOctave} -> Expected: ${expectedFreq.toFixed(2)}Hz`);
      
      // Play the note with our system
      this.playAdvancedSynth(expectedFreq, layerId, 0.7, 'synth', {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 }
      });
      
      noteIndex++;
      setTimeout(playNext, 800); // Wait 800ms between notes
    };
    
    playNext();
  }

  // Test specific note accuracy
  public testNoteAccuracy(note: string, octave: number, layerId: string = 'piano'): void {
    const noteWithOctave = `${note}${octave}`;
    const expectedFreq = this.noteToFrequency(noteWithOctave);
    
    console.log(`🎵 === NOTE ACCURACY TEST ===`);
    console.log(`🎹 Testing: ${noteWithOctave}`);
    console.log(`🎵 Expected frequency: ${expectedFreq.toFixed(2)}Hz`);
    console.log(`🎛️ Using layer: ${layerId}`);
    
    // Play the note and log detailed info
    this.playAdvancedSynth(expectedFreq, layerId, 0.8, 'synth', {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.3 }
    });
    
    // Also test with reference frequency for comparison
    setTimeout(() => {
      console.log(`🎵 Playing reference A4 (440Hz) for comparison...`);
      this.playAdvancedSynth(440, layerId, 0.8, 'synth', {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.3 }
      });
    }, 1000);
    
    console.log(`🎵 === END NOTE TEST ===`);
  }

  // Get expected frequencies for all notes in an octave
  private getExpectedFrequencies(octave: number): Record<string, number> {
    // Base frequencies for octave 4
    const baseFreqs: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
    
    // Calculate frequencies for the requested octave
    const octaveMultiplier = Math.pow(2, octave - 4);
    const frequencies: Record<string, number> = {};
    
    for (const [note, freq] of Object.entries(baseFreqs)) {
      frequencies[note] = freq * octaveMultiplier;
    }
    
    return frequencies;
  }

  // Enhanced note to frequency conversion with better octave support
  // (This function is used by the testing methods above)

  // Test chromatic scale progression
  public testChromaticScale(startNote: string = 'C4', steps: number = 12, layerId: string = 'piano'): void {
    console.log(`🎼 === CHROMATIC SCALE TEST ===`);
    console.log(`🎹 Starting from ${startNote}, ${steps} steps`);
    
    const startFreq = this.noteToFrequency(startNote);
    let currentFreq = startFreq;
    
    for (let i = 0; i < steps; i++) {
      const semitoneRatio = Math.pow(2, 1/12); // Equal temperament ratio
      
      setTimeout(() => {
        console.log(`🎵 Step ${i + 1}: ${currentFreq.toFixed(2)}Hz`);
        this.playAdvancedSynth(currentFreq, layerId, 0.6, 'synth', {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
        });
        
        if (i === steps - 1) {
          console.log(`🎼 Chromatic scale test completed`);
          console.log(`🎼 === END CHROMATIC TEST ===`);
        }
      }, i * 300);
      
      currentFreq *= semitoneRatio;
    }
  }

  // Test intervals for harmonic accuracy
  public testIntervals(rootNote: string = 'C4', layerId: string = 'piano'): void {
    console.log(`🎼 === INTERVAL ACCURACY TEST ===`);
    console.log(`🎹 Root note: ${rootNote}`);
    
    const rootFreq = this.noteToFrequency(rootNote);
    const intervals = [
      { name: 'Unison', ratio: 1, semitones: 0 },
      { name: 'Minor 2nd', ratio: 16/15, semitones: 1 },
      { name: 'Major 2nd', ratio: 9/8, semitones: 2 },
      { name: 'Minor 3rd', ratio: 6/5, semitones: 3 },
      { name: 'Major 3rd', ratio: 5/4, semitones: 4 },
      { name: 'Perfect 4th', ratio: 4/3, semitones: 5 },
      { name: 'Tritone', ratio: Math.sqrt(2), semitones: 6 },
      { name: 'Perfect 5th', ratio: 3/2, semitones: 7 },
      { name: 'Octave', ratio: 2, semitones: 12 }
    ];
    
    intervals.forEach((interval, index) => {
      setTimeout(() => {
        const intervalFreq = rootFreq * Math.pow(2, interval.semitones / 12);
        console.log(`🎵 ${interval.name}: ${intervalFreq.toFixed(2)}Hz (${interval.semitones} semitones)`);
        
        // Play root and interval together
        this.playAdvancedSynth(rootFreq, layerId, 0.5, 'synth', {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 1.0, sustain: 0, release: 0.3 }
        });
        
        setTimeout(() => {
          this.playAdvancedSynth(intervalFreq, layerId, 0.5, 'synth', {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 1.0, sustain: 0, release: 0.3 }
          });
        }, 100);
        
        if (index === intervals.length - 1) {
          setTimeout(() => {
            console.log(`🎼 Interval test completed`);
            console.log(`🎼 === END INTERVAL TEST ===`);
          }, 1500);
        }
      }, index * 2000);
    });
  }

  // Quick pitch verification for debugging
  public verifyPitch(expectedFreq: number, actualNote: string, layerId: string = 'piano'): void {
    const actualFreq = this.noteToFrequency(actualNote);
    const difference = Math.abs(expectedFreq - actualFreq);
    const percentDiff = (difference / expectedFreq) * 100;
    
    console.log(`🔍 === PITCH VERIFICATION ===`);
    console.log(`🎵 Expected: ${expectedFreq.toFixed(2)}Hz`);
    console.log(`🎵 Actual (${actualNote}): ${actualFreq.toFixed(2)}Hz`);
    console.log(`🎵 Difference: ${difference.toFixed(2)}Hz (${percentDiff.toFixed(2)}%)`);
    
    if (percentDiff < 0.1) {
      console.log(`✅ Pitch accuracy: EXCELLENT`);
    } else if (percentDiff < 1.0) {
      console.log(`✅ Pitch accuracy: GOOD`);
    } else if (percentDiff < 5.0) {
      console.log(`⚠️ Pitch accuracy: FAIR - minor tuning issue`);
    } else {
      console.log(`❌ Pitch accuracy: POOR - significant tuning issue`);
    }
    
    // Play both for comparison
    console.log(`🎵 Playing expected frequency...`);
    this.playAdvancedSynth(expectedFreq, layerId, 0.7, 'synth');
    
    setTimeout(() => {
      console.log(`🎵 Playing actual note frequency...`);
      this.playAdvancedSynth(actualFreq, layerId, 0.7, 'synth');
    }, 1000);
    
    console.log(`🔍 === END VERIFICATION ===`);
  }

  // Emergency audio test - bypasses everything and goes direct to speakers
  public emergencyAudioTest(): void {
    console.log('🚨 EMERGENCY AUDIO TEST - Direct to speakers');
    try {
      const emergencyOsc = new Tone.Oscillator(1000, 'sine');
      const emergencyGain = new Tone.Gain(0.3);
      
      emergencyOsc.connect(emergencyGain);
      emergencyGain.toDestination(); // Skip our entire chain
      
      emergencyOsc.start();
      emergencyOsc.stop('+0.5');
      
      setTimeout(() => {
        emergencyOsc.dispose();
        emergencyGain.dispose();
        console.log('🚨 Emergency test completed - If you heard nothing, the issue is with browser audio permissions or speakers');
      }, 600);
      
    } catch (error) {
      console.error('🚨 Emergency test failed:', error);
    }
  }

  dispose(): void {
    this.layers.clear();
    this.activeSources.forEach(sources => {
      sources.forEach(source => source.dispose());
    });
    this.activeSources.clear();
    this.bufferPool.clear();
    this.masterGain.dispose();
    this.limiter.dispose();
  }
}