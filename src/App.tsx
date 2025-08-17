import { Theme } from "@radix-ui/themes";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ModelHero from "./landing/ModelHero";
import BirthdayCake from "./components/BirthdayCake";
import CurvedLoop from "./components/CurvedLoop";
import { useBirthdayMusic } from "./hooks/useBirthdayMusic";

function App() {
  const [showCake, setShowCake] = useState(false);
  const FADE_MS = 600;
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playBirthdayMelody } = useBirthdayMusic();

  // Play birthday music when cake is shown
  useEffect(() => {
    if (showCake) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        // Try to play the audio file first
        if (audioRef.current) {
          audioRef.current.volume = 0.7; // Set volume to 70%
          audioRef.current.play().catch((error) => {
            console.log(
              "Audio file not available, using Web Audio fallback:",
              error
            );
            // If audio file fails, play the melody using Web Audio API
            playBirthdayMelody();
          });
        } else {
          // No audio element, use Web Audio API
          playBirthdayMelody();
        }
      }, 300); // 300ms delay for smooth transition
    }
  }, [showCake, playBirthdayMelody]);

  return (
    <Theme>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          maxHeight: "100dvh", // Dynamic viewport height for mobile
          position: "relative",
          overflow: "hidden",
          touchAction: "manipulation", // Improve touch responsiveness
        }}
      >
        {/* Landing Page */}
        {!showCake && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.9,
              filter: "blur(8px)",
            }}
            transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <div style={{ position: "absolute", inset: 0 }}>
              <ModelHero />
            </div>

            {/* CurvedLoop Birthday Text */}
            <div
              style={{
                position: "absolute",
                top: "clamp(3%, 8vh, 10%)", // Responsive top positioning
                left: 0,
                right: 0,
                zIndex: 10,
                height: "clamp(20%, 25vh, 30%)", // Responsive height
                minHeight: "120px", // Ensure minimum readable size
              }}
            >
              <CurvedLoop
                marqueeText="Happy ✦ Birthday ✦ Nouhaila ✦"
                speed={1}
                curveAmount={300}
                direction="right"
                interactive={false}
              />
            </div>

            {/* Magical Button */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.6, type: "spring" }}
              style={{
                position: "absolute",
                bottom: "15%",
                left: "5%", // Add side margins for mobile
                right: "5%", // Add side margins for mobile
                display: "flex",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <motion.button
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 40px rgba(255, 105, 180, 0.8)",
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255, 215, 0, 0.6)",
                    "0 0 40px rgba(255, 105, 180, 0.8)",
                    "0 0 60px rgba(138, 43, 226, 0.6)",
                    "0 0 40px rgba(255, 105, 180, 0.8)",
                    "0 0 20px rgba(255, 215, 0, 0.6)",
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                onClick={() => setShowCake(true)}
                style={{
                  padding: "1.2rem 2.5rem", // Larger padding for mobile
                  fontSize: "clamp(1.1rem, 4vw, 1.4rem)", // Responsive font size
                  fontWeight: 700,
                  fontFamily: "'Comic Sans MS', cursive, sans-serif",
                  border: "none",
                  borderRadius: "50px",
                  background:
                    "linear-gradient(45deg, #ff6b9d, #ffa8cc, #ffcccb, #ffd700)",
                  backgroundSize: "300% 300%",
                  color: "white",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  minHeight: "60px", // Ensure good touch target
                  minWidth: "200px", // Ensure good touch target
                  touchAction: "manipulation", // Improve touch response
                  maxWidth: "90vw", // Prevent overflow on small screens
                  textAlign: "center",
                }}
              >
                <motion.span
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    background:
                      "linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent)",
                    backgroundSize: "200% 100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                  }}
                />
                <span style={{ position: "relative", zIndex: 2 }}>
                  🎂 Open Your Surprise! ✨
                </span>
              </motion.button>
            </motion.div>

            {/* Floating Sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.random() * 200 - 100],
                  y: [0, Math.random() * 200 - 100],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`,
                  fontSize: "1.5rem",
                  zIndex: 5,
                }}
              >
                {i % 2 === 0 ? "✨" : "🌟"}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Birthday Cake */}
        {showCake && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: FADE_MS / 1000, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <BirthdayCake onBackToLanding={() => setShowCake(false)} />
          </motion.div>
        )}

        {/* Birthday Music - Korean Happy Birthday Song */}
        <audio
          ref={audioRef}
          loop
          preload="auto"
          crossOrigin="anonymous"
          style={{ display: "none" }}
        >
          {/* Korean Happy Birthday Song - place your downloaded file here */}
          <source src="/audio/happy-birthday.mp3" type="audio/mpeg" />
          <source src="/audio/happy-birthday.wav" type="audio/wav" />
          <source src="/audio/happy-birthday.ogg" type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </Theme>
  );
}

export default App;
