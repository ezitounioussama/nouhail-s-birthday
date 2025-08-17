import { useRef, useCallback } from "react";

// Simple birthday melody using Web Audio API
const BIRTHDAY_MELODY = [
  { note: "C4", duration: 0.5 },
  { note: "C4", duration: 0.3 },
  { note: "D4", duration: 0.7 },
  { note: "C4", duration: 0.7 },
  { note: "F4", duration: 0.7 },
  { note: "E4", duration: 1.4 },

  { note: "C4", duration: 0.5 },
  { note: "C4", duration: 0.3 },
  { note: "D4", duration: 0.7 },
  { note: "C4", duration: 0.7 },
  { note: "G4", duration: 0.7 },
  { note: "F4", duration: 1.4 },
];

const NOTE_FREQUENCIES: { [key: string]: number } = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
};

export const useBirthdayMusic = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  const playBirthdayMelody = useCallback(async () => {
    try {
      // Initialize audio context if not already done
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (isPlayingRef.current) return;
      isPlayingRef.current = true;

      let currentTime = audioContext.currentTime + 0.1;

      // Play the melody
      BIRTHDAY_MELODY.forEach(({ note, duration }) => {
        const frequency = NOTE_FREQUENCIES[note];
        if (frequency) {
          // Create oscillator for the note
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(frequency, currentTime);
          oscillator.type = "triangle"; // Softer sound

          // Envelope for smooth note attack and release
          gainNode.gain.setValueAtTime(0, currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.1, currentTime + duration - 0.05);
          gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

          oscillator.start(currentTime);
          oscillator.stop(currentTime + duration);

          currentTime += duration + 0.1; // Small gap between notes
        }
      });

      // Reset playing flag when melody finishes
      setTimeout(() => {
        isPlayingRef.current = false;
      }, currentTime * 1000);
    } catch (error) {
      console.log("Web Audio API not supported or error occurred:", error);
      isPlayingRef.current = false;
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  return { playBirthdayMelody, stopMusic };
};
