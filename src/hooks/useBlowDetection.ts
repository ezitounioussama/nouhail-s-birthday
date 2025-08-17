import { useEffect, useRef, useState, useCallback } from "react";

interface BlowDetectionHook {
  isListening: boolean;
  isBlowing: boolean;
  isCalibrating: boolean;
  startListening: () => void;
  stopListening: () => void;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useBlowDetection(): BlowDetectionHook {
  const [isListening, setIsListening] = useState(false);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Blow detection parameters
  const blowThreshold = 0.05; // Increased threshold to reduce false positives
  const blowDuration = 300; // Increased duration for more deliberate blowing
  const blowCooldown = 3000; // Longer cooldown to prevent rapid triggering

  const lastBlowTimeRef = useRef<number>(0);
  const blowStartTimeRef = useRef<number>(0);
  const baselineRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number[]>([]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Test if we can access the microphone
      stream.getTracks().forEach((track) => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.warn("Microphone permission denied:", error);
      setPermissionGranted(false);
      return false;
    }
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate the average amplitude in the blow frequency range (typically 0-500Hz)
    // This corresponds to roughly the first 10-15% of the frequency spectrum
    const blowRangeEnd = Math.floor(bufferLength * 0.15);
    let sum = 0;
    for (let i = 0; i < blowRangeEnd; i++) {
      sum += dataArray[i];
    }
    const average = sum / blowRangeEnd / 255; // Normalize to 0-1

    // Establish baseline during first few seconds
    if (calibrationSamplesRef.current.length < 50) {
      calibrationSamplesRef.current.push(average);
      if (calibrationSamplesRef.current.length === 50) {
        const baseline =
          calibrationSamplesRef.current.reduce((a, b) => a + b, 0) / 50;
        baselineRef.current = baseline;
        setIsCalibrating(false);
        console.log(
          "🎤 Baseline calibrated:",
          baseline,
          "Adjusted threshold:",
          baseline + blowThreshold
        );
      }
      if (isListening) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
      return;
    }

    const now = performance.now();
    const adjustedThreshold = baselineRef.current + blowThreshold;

    // Check if we're detecting a blow above baseline
    if (average > adjustedThreshold) {
      if (blowStartTimeRef.current === 0) {
        blowStartTimeRef.current = now;
        console.log("🔊 Blow detected! Starting timer...", {
          average,
          baseline: baselineRef.current,
          threshold: adjustedThreshold,
        });
      } else if (
        now - blowStartTimeRef.current > blowDuration &&
        now - lastBlowTimeRef.current > blowCooldown
      ) {
        // Valid blow detected!
        console.log("💨 Valid blow confirmed! Candles should turn off", {
          average,
          baseline: baselineRef.current,
          threshold: adjustedThreshold,
          duration: now - blowStartTimeRef.current,
          timeSinceLastBlow: now - lastBlowTimeRef.current,
        });
        setIsBlowing(true);
        lastBlowTimeRef.current = now;

        // Reset blow state after a short time
        setTimeout(() => {
          console.log("🕯️ Resetting blow state");
          setIsBlowing(false);
        }, 200);
      }
    } else {
      blowStartTimeRef.current = 0;
    }

    if (isListening) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isListening, blowThreshold, blowDuration, blowCooldown]);

  const startListening = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      // Create audio context
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      // Get microphone stream
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio source and analyser
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(
        streamRef.current
      );
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Configure analyser
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Connect microphone to analyser
      microphoneRef.current.connect(analyserRef.current);

      // Reset calibration for new session
      calibrationSamplesRef.current = [];
      baselineRef.current = 0;
      setIsCalibrating(true);

      console.log("🎤 Blow detection started! Calibrating baseline...");
      setIsListening(true);
      analyzeAudio();
    } catch (error) {
      console.error("Error starting blow detection:", error);
      // Call stopListening directly to avoid circular dependency
      setIsListening(false);
      setIsBlowing(false);
    }
  }, [permissionGranted, requestPermission, analyzeAudio]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsBlowing(false);
    setIsCalibrating(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isBlowing,
    isCalibrating,
    startListening,
    stopListening,
    permissionGranted,
    requestPermission,
  };
}
