import React, { useState, useEffect } from 'react';
import AudioRepairWorker, { AudioHealthStatus } from '../audio/AudioRepairWorker';
import './AudioRepairPanel.css';

interface AudioRepairPanelProps {
  worker: AudioRepairWorker;
}

const AudioRepairPanel: React.FC<AudioRepairPanelProps> = ({ worker }) => {
  const [healthStatus, setHealthStatus] = useState<AudioHealthStatus>(worker.getHealthStatus());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  useEffect(() => {
    // Subscribe to health status updates
    worker.onStatusUpdate((status) => {
      setHealthStatus(status);
    });
  }, [worker]);

  const handleToggleEnabled = () => {
    const config = worker.getConfig();
    worker.setEnabled(!config.enabled);
  };

  const handleForceRepair = async () => {
    setIsRepairing(true);
    try {
      const success = await worker.forceRepair();
      console.log(`Manual repair ${success ? 'successful' : 'failed'}`);
    } finally {
      setIsRepairing(false);
    }
  };

  const getStatusIcon = () => {
    if (!healthStatus.engineAvailable) return '❌';
    if (!healthStatus.audioContextRunning) return '⏸️';
    if (!healthStatus.layersInitialized) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (!healthStatus.engineAvailable) return 'Engine Not Available';
    if (!healthStatus.audioContextRunning) return 'Audio Context Stopped';
    if (!healthStatus.layersInitialized) return 'Layers Not Initialized';
    return 'Audio System Healthy';
  };

  const getStatusColor = () => {
    if (!healthStatus.engineAvailable || !healthStatus.audioContextRunning) return '#ff4444';
    if (!healthStatus.layersInitialized) return '#ff8800';
    return '#44ff44';
  };

  const config = worker.getConfig();

  return (
    <div className="audio-repair-panel">
      <div className="repair-status-bar">
        <div className="status-indicator">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="repair-controls">
          <button
            className={`toggle-button ${config.enabled ? 'enabled' : 'disabled'}`}
            onClick={handleToggleEnabled}
            title={`${config.enabled ? 'Disable' : 'Enable'} automatic audio repair`}
          >
            🔧 {config.enabled ? 'ON' : 'OFF'}
          </button>
          
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Show/hide repair details"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="repair-details">
          <div className="health-stats">
            <div className="stat-row">
              <span className="stat-label">Engine Available:</span>
              <span className={`stat-value ${healthStatus.engineAvailable ? 'good' : 'bad'}`}>
                {healthStatus.engineAvailable ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Audio Context:</span>
              <span className={`stat-value ${healthStatus.audioContextRunning ? 'good' : 'bad'}`}>
                {healthStatus.audioContextRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Layers Initialized:</span>
              <span className={`stat-value ${healthStatus.layersInitialized ? 'good' : 'bad'}`}>
                {healthStatus.layersInitialized ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Repair Attempts:</span>
              <span className="stat-value">
                {healthStatus.repairAttempts}/{config.maxRetries}
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Last Check:</span>
              <span className="stat-value">
                {new Date(healthStatus.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="repair-actions">
            <button
              className="repair-button"
              onClick={handleForceRepair}
              disabled={isRepairing || !healthStatus.engineAvailable}
              title="Manually trigger audio system repair"
            >
              {isRepairing ? '🔄 Repairing...' : '🛠️ Force Repair'}
            </button>
            
            <div className="config-info">
              <small>
                Check interval: {config.checkInterval}ms | 
                Max retries: {config.maxRetries} | 
                Retry delay: {config.retryDelay}ms
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRepairPanel;