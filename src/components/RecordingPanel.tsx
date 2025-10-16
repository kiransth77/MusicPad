import { useState, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useAudioEngine } from '../hooks/useAudioEngine';
import './RecordingPanel.css';

interface RecordingPanelProps {
  isAudioReady: boolean;
}

interface RecordedClip {
  id: string;
  name: string;
  duration: number;
  buffer: Tone.ToneAudioBuffer | null;
  createdAt: Date;
}

export const RecordingPanel: React.FC<RecordingPanelProps> = ({ isAudioReady }) => {
  const { engine } = useAudioEngine();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [clips, setClips] = useState<RecordedClip[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const recorderRef = useRef<Tone.Recorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startRecording = useCallback(async () => {
    if (!isAudioReady || !engine) return;

    try {
      // Create recorder connected to master output
      const recorder = engine.createRecorder();
      recorderRef.current = recorder;
      
      // Start recording
      await recorder.start();
      
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordingTime(elapsed);
      }, 100);

      console.log('🎙️ Recording started successfully - connected to audio engine master output');
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Reset state on error
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isAudioReady, engine]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) return;

    try {
      // Stop recording and get the audio buffer
      const recording = await recorderRef.current.stop();
      
      // Convert blob to audio buffer
      const arrayBuffer = await recording.arrayBuffer();
      const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
      const toneBuffer = new Tone.ToneAudioBuffer(audioBuffer);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Create new clip
      const newClip: RecordedClip = {
        id: `clip-${Date.now()}`,
        name: `Clip ${clips.length + 1}`,
        duration: recordingTime,
        buffer: toneBuffer,
        createdAt: new Date()
      };

      setClips(prev => [...prev, newClip]);
      setIsRecording(false);
      setRecordingTime(0);
      recorderRef.current = null;

      console.log(`🎙️ Recording saved: ${newClip.name} (${formatTime(newClip.duration)})`);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [isRecording, recordingTime, clips.length, formatTime]);

  const pauseRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
    console.log('🎙️ Recording paused');
  }, []);

  const resumeRecording = useCallback(() => {
    startTimeRef.current = Date.now() - (recordingTime * 1000);
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setRecordingTime(elapsed);
    }, 100);
    setIsPaused(false);
    console.log('🎙️ Recording resumed');
  }, [recordingTime]);

  const playClip = useCallback(async (clip: RecordedClip) => {
    if (!clip.buffer || isPlaying === clip.id) {
      return;
    }

    try {
      const player = new Tone.Player().toDestination();
      player.buffer = clip.buffer;
      
      setIsPlaying(clip.id);
      player.start();
      
      player.onstop = () => {
        setIsPlaying(null);
        player.dispose();
      };

      // Auto-stop after clip duration
      setTimeout(() => {
        if (player.state === 'started') {
          player.stop();
        }
      }, clip.duration * 1000);

      console.log(`▶️ Playing clip: ${clip.name}`);
    } catch (error) {
      console.error('Failed to play clip:', error);
      setIsPlaying(null);
    }
  }, [isPlaying]);

  const deleteClip = useCallback((clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
    if (isPlaying === clipId) {
      setIsPlaying(null);
    }
    console.log(`🗑️ Deleted clip: ${clipId}`);
  }, [isPlaying]);

  const exportClip = useCallback((clip: RecordedClip) => {
    if (!clip.buffer) return;

    try {
      // For now, we'll just log that export was requested
      // In a full implementation, you'd use a library like wav-encoder
      console.log(`💾 Export requested for clip: ${clip.name}`);
      alert(`Export feature coming soon!\nClip: ${clip.name}\nDuration: ${formatTime(clip.duration)}`);
    } catch (error) {
      console.error('Failed to export clip:', error);
    }
  }, [formatTime]);

  return (
    <div className="recording-panel">
      <div className="recording-controls">
        <h3>🎙️ Recording Studio</h3>
        
        <div className="tempo-control">
          <label>
            BPM: 
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              min="60"
              max="200"
              disabled={isRecording}
            />
          </label>
          <div className="tempo-display">{bpm} BPM</div>
        </div>

        <div className="record-controls">
          <div className="record-timer">{formatTime(recordingTime)}</div>
          
          <div className="record-buttons">
            {!isRecording ? (
              <button
                className="record-btn start"
                onClick={startRecording}
                disabled={!isAudioReady}
                title="Start Recording"
              >
                ⏺️ REC
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    className="record-btn pause"
                    onClick={pauseRecording}
                    title="Pause Recording"
                  >
                    ⏸️ PAUSE
                  </button>
                ) : (
                  <button
                    className="record-btn resume"
                    onClick={resumeRecording}
                    title="Resume Recording"
                  >
                    ▶️ RESUME
                  </button>
                )}
                
                <button
                  className="record-btn stop"
                  onClick={stopRecording}
                  title="Stop Recording"
                >
                  ⏹️ STOP
                </button>
              </>
            )}
          </div>

          {isRecording && (
            <div className="recording-indicator">
              <div className="pulse-dot"></div>
              <span>Recording...</span>
            </div>
          )}
        </div>
      </div>

      <div className="clips-section">
        <h4>📼 Recorded Clips ({clips.length})</h4>
        
        {clips.length === 0 ? (
          <div className="no-clips">
            <p>No clips recorded yet</p>
            <p>Click REC to start your first recording!</p>
          </div>
        ) : (
          <div className="clips-list">
            {clips.map((clip) => (
              <div key={clip.id} className="clip-item">
                <div className="clip-info">
                  <div className="clip-name">{clip.name}</div>
                  <div className="clip-duration">{formatTime(clip.duration)}</div>
                  <div className="clip-date">
                    {clip.createdAt.toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="clip-controls">
                  <button
                    className={`play-btn ${isPlaying === clip.id ? 'playing' : ''}`}
                    onClick={() => playClip(clip)}
                    disabled={!clip.buffer}
                    title="Play Clip"
                  >
                    {isPlaying === clip.id ? '⏸️' : '▶️'}
                  </button>
                  
                  <button
                    className="export-btn"
                    onClick={() => exportClip(clip)}
                    title="Export as WAV"
                  >
                    💾
                  </button>
                  
                  <button
                    className="delete-btn"
                    onClick={() => deleteClip(clip.id)}
                    title="Delete Clip"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingPanel;