/**
 * AudioRepairWorker - Automatic audio system repair and monitoring
 * Detects broken audio states and automatically fixes them in the background
 */

interface AudioRepairConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

interface AudioHealthStatus {
  timestamp: number;
  layersInitialized: boolean;
  audioContextRunning: boolean;
  engineAvailable: boolean;
  lastRepairAttempt?: number;
  repairAttempts: number;
}

class AudioRepairWorker {
  private config: AudioRepairConfig;
  private intervalId: number | null = null;
  private isRunning = false;
  private healthStatus: AudioHealthStatus;
  private onStatusChange?: (status: AudioHealthStatus) => void;

  constructor(config: Partial<AudioRepairConfig> = {}) {
    this.config = {
      enabled: true,
      checkInterval: 2000, // Check every 2 seconds
      maxRetries: 5,
      retryDelay: 1000,
      ...config
    };

    this.healthStatus = {
      timestamp: Date.now(),
      layersInitialized: false,
      audioContextRunning: false,
      engineAvailable: false,
      repairAttempts: 0
    };

    // Auto-start if enabled
    if (this.config.enabled) {
      this.start();
    }

    console.log('🔧 AudioRepairWorker initialized:', this.config);
  }

  /**
   * Start the automatic repair monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.log('🔧 AudioRepairWorker already running');
      return;
    }

    this.isRunning = true;
    console.log('🔧 AudioRepairWorker started - monitoring audio health');

    this.intervalId = window.setInterval(() => {
      this.checkAudioHealth();
    }, this.config.checkInterval);

    // Initial check
    setTimeout(() => this.checkAudioHealth(), 500);
  }

  /**
   * Stop the automatic repair monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🔧 AudioRepairWorker stopped');
  }

  /**
   * Enable or disable the repair worker
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && !this.isRunning) {
      this.start();
    } else if (!enabled && this.isRunning) {
      this.stop();
    }

    console.log(`🔧 AudioRepairWorker ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set callback for status changes
   */
  onStatusUpdate(callback: (status: AudioHealthStatus) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Get current health status
   */
  getHealthStatus(): AudioHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Check current audio system health
   */
  private checkAudioHealth(): void {
    if (!this.config.enabled) {
      return;
    }

    const previousStatus = { ...this.healthStatus };
    
    try {
      // Check if AudioEngine is available
      const audioEngine = (window as any).audioEngine || (window as any).__audioEngineInstance;
      this.healthStatus.engineAvailable = !!audioEngine;

      if (!audioEngine) {
        console.log('🔧 AudioEngine not found - skipping health check');
        this.updateStatus();
        return;
      }

      // Check audio context state
      this.healthStatus.audioContextRunning = audioEngine.context?.state === 'running';

      // Check if layers are initialized
      const layerCount = audioEngine.layers?.size || 0;
      const hasRequiredLayers = audioEngine.hasLayer?.('piano') && audioEngine.hasLayer?.('drums');
      this.healthStatus.layersInitialized = layerCount > 0 && hasRequiredLayers;

      this.healthStatus.timestamp = Date.now();

      // Determine if repair is needed
      const needsRepair = this.healthStatus.engineAvailable && 
                         this.healthStatus.audioContextRunning && 
                         !this.healthStatus.layersInitialized;

      if (needsRepair && this.shouldAttemptRepair()) {
        console.log('🔧 Audio health check failed - attempting repair');
        this.attemptRepair(audioEngine);
      } else if (this.healthStatus.layersInitialized && previousStatus.repairAttempts > 0) {
        // Reset repair attempts on successful recovery
        this.healthStatus.repairAttempts = 0;
        console.log('✅ Audio system recovered successfully');
      }

    } catch (error) {
      console.error('🔧 Error during audio health check:', error);
      this.healthStatus.engineAvailable = false;
      this.healthStatus.audioContextRunning = false;
      this.healthStatus.layersInitialized = false;
    }

    this.updateStatus();
  }

  /**
   * Determine if we should attempt a repair
   */
  private shouldAttemptRepair(): boolean {
    if (this.healthStatus.repairAttempts >= this.config.maxRetries) {
      return false;
    }

    const now = Date.now();
    const lastAttempt = this.healthStatus.lastRepairAttempt || 0;
    const timeSinceLastAttempt = now - lastAttempt;

    return timeSinceLastAttempt >= this.config.retryDelay;
  }

  /**
   * Attempt to repair the audio system
   */
  private async attemptRepair(audioEngine: any): Promise<void> {
    this.healthStatus.lastRepairAttempt = Date.now();
    this.healthStatus.repairAttempts++;

    try {
      console.log(`🔧 Repair attempt ${this.healthStatus.repairAttempts}/${this.config.maxRetries}`);

      // Define the required instrument layers
      const instrumentLayers = [
        {
          name: 'Electronic Drums',
          id: 'drums',
          type: 'drums' as const,
          volume: 0.8,
          muted: false,
          effects: []
        },
        {
          name: 'Electric Piano', 
          id: 'piano',
          type: 'synth' as const,
          volume: 0.6,
          muted: false,
          effects: [],
          synthType: 'triangle' as const,
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.4,
            release: 1.2
          }
        }
      ];

      // Clear existing layers first
      if (audioEngine.layers && typeof audioEngine.layers.clear === 'function') {
        audioEngine.layers.clear();
        console.log('🔧 Cleared existing layers');
      }

      // Add each layer
      let layersAdded = 0;
      for (const layer of instrumentLayers) {
        try {
          if (typeof audioEngine.addLayer === 'function') {
            audioEngine.addLayer(layer);
            layersAdded++;
            console.log(`🔧 Added layer: ${layer.name} (${layer.id})`);
          }
        } catch (layerError) {
          console.error(`🔧 Failed to add layer ${layer.id}:`, layerError);
        }
      }

      // Verify repair success
      const hasRequiredLayers = audioEngine.hasLayer?.('piano') && audioEngine.hasLayer?.('drums');
      if (hasRequiredLayers && layersAdded > 0) {
        console.log(`✅ Audio repair successful - added ${layersAdded} layers`);
        this.healthStatus.layersInitialized = true;
        
        // Test piano functionality
        try {
          if (typeof audioEngine.playAdvancedSynth === 'function') {
            // Quick test note (very low volume)
            audioEngine.playAdvancedSynth('piano', 'piano', 440, 0.01);
            console.log('🎹 Piano test successful');
          }
        } catch (testError) {
          console.log('🎹 Piano test failed (non-critical):', testError);
        }
        
      } else {
        console.log('⚠️ Audio repair completed but layers not properly initialized');
      }

    } catch (error) {
      console.error('🔧 Audio repair failed:', error);
    }
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(): void {
    if (this.onStatusChange) {
      this.onStatusChange(this.getHealthStatus());
    }
  }

  /**
   * Get configuration
   */
  getConfig(): AudioRepairConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AudioRepairConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };
    
    // Handle enable/disable state changes
    if (wasEnabled !== this.config.enabled) {
      this.setEnabled(this.config.enabled);
    }
    
    // Restart with new interval if running
    if (this.isRunning && newConfig.checkInterval && newConfig.checkInterval !== this.config.checkInterval) {
      this.stop();
      this.start();
    }

    console.log('🔧 AudioRepairWorker config updated:', this.config);
  }

  /**
   * Force a manual repair attempt
   */
  async forceRepair(): Promise<boolean> {
    console.log('🔧 Manual repair attempt requested');
    
    const audioEngine = (window as any).audioEngine || (window as any).__audioEngineInstance;
    if (!audioEngine) {
      console.error('🔧 Cannot repair - AudioEngine not available');
      return false;
    }

    // Reset retry counters for manual repair
    this.healthStatus.repairAttempts = 0;
    this.healthStatus.lastRepairAttempt = 0;

    await this.attemptRepair(audioEngine);
    
    // Check if repair was successful
    this.checkAudioHealth();
    return this.healthStatus.layersInitialized;
  }
}

export default AudioRepairWorker;
export type { AudioRepairConfig, AudioHealthStatus };