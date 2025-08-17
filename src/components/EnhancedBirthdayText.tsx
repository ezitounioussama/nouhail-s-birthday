import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface EnhancedBirthdayTextProps {
  delay?: number;
}

export default function EnhancedBirthdayText({
  delay = 0.5,
}: EnhancedBirthdayTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();
  const [animationStarted, setAnimationStarted] = useState(false);

  const text = "Happy Birthday Darling";

  useEffect(() => {
    if (isInView && !animationStarted) {
      setAnimationStarted(true);
      controls.start("visible");
    }
  }, [isInView, controls, animationStarted]);

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 100,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        type: "spring" as const,
        bounce: 0.4,
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  };

  // Curved loop animation for each letter
  const getCurvedLoopAnimation = (index: number) => ({
    y: [0, -30, 0],
    x: [0, Math.sin(index * 0.5) * 20, 0],
    rotate: [0, Math.sin(index * 0.3) * 10, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      delay: index * 0.2,
      ease: "easeInOut" as const,
    },
  });

  return (
    <div ref={ref} style={{ perspective: "1000px" }}>
      {/* Particle Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              scale: 0,
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 800),
              y: Math.random() * 200 + 100,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              y: [null, "-=120"],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 3 + delay,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              fontSize: "1.2rem",
              zIndex: 1,
            }}
          >
            {["✨", "🌟", "💖", "🎉", "🎂"][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}
      </div>

      {/* Main Text Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "2rem 1rem",
        }}
      >
        {/* Curved Loop Text */}
        <div
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 700,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            color: "#000000",
            margin: 0,
            lineHeight: 1.2,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.1em",
            letterSpacing: "0.02em",
          }}
        >
          {text.split("").map((char, i) => (
            <motion.span
              key={i}
              variants={letterVariants}
              style={{
                display: "inline-block",
                minWidth: char === " " ? "0.5em" : "auto",
                transformOrigin: "center bottom",
              }}
              {...(animationStarted && {
                animate: getCurvedLoopAnimation(i),
              })}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={animationStarted ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 2, duration: 0.8, type: "spring" }}
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            fontSize: "2.5rem",
          }}
        >
          {["🎂", "🎉", "💕", "🌟", "🎈"].map((emoji, i) => (
            <motion.span
              key={i}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
              style={{
                display: "inline-block",
                cursor: "default",
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
