import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface BirthdayCardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function BirthdayCard({ isVisible, onClose }: BirthdayCardProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const birthdayMessage = `Happy Birthday Nouhaila! 🎉

You are truly the best online friend I could ever ask for! 💖

Your kindness, humor, and amazing personality
light up every conversation we have.

Distance means nothing when someone means everything,
and you mean the world to me! 🌟

May this special day bring you all the joy,
love, and happiness you deserve.

Here's to another year of incredible friendship
and unforgettable memories! 🥳

With love and best wishes 💝`;

  useEffect(() => {
    if (!isVisible || !mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Card geometry - a rounded rectangle
    const cardWidth = 4;
    const cardHeight = 3;
    const cardDepth = 0.1;

    const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);

    // Card material with gradient-like effect
    const cardMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });

    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.castShadow = true;
    card.receiveShadow = true;
    scene.add(card);

    // Border for the card
    const borderGeometry = new THREE.EdgesGeometry(cardGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xff69b4,
      linewidth: 3
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    scene.add(border);

    // Decorative hearts floating around
    const heartShape = new THREE.Shape();
    heartShape.moveTo(25, 25);
    heartShape.bezierCurveTo(25, 25, 20, 0, 0, 0);
    heartShape.bezierCurveTo(-30, 0, -30, 35, -30, 35);
    heartShape.bezierCurveTo(-30, 55, -10, 77, 25, 95);
    heartShape.bezierCurveTo(60, 77, 80, 55, 80, 35);
    heartShape.bezierCurveTo(80, 35, 80, 0, 50, 0);
    heartShape.bezierCurveTo(35, 0, 25, 25, 25, 25);

    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.1,
      bevelEnabled: false,
    });

    // Scale down the heart
    heartGeometry.scale(0.01, 0.01, 0.01);

    const hearts: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const heartMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.8, 0.7, 0.6),
      });
      const heart = new THREE.Mesh(heartGeometry, heartMaterial);

      // Random positions around the card
      const angle = (i / 8) * Math.PI * 2;
      const radius = 3;
      heart.position.x = Math.cos(angle) * radius;
      heart.position.y = Math.sin(angle) * radius;
      heart.position.z = Math.random() * 2 - 1;

      heart.rotation.z = Math.random() * Math.PI;
      heart.scale.setScalar(0.5 + Math.random() * 0.5);

      hearts.push(heart);
      scene.add(heart);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Point lights for magical effect
    const pointLight1 = new THREE.PointLight(0xff69b4, 1, 10);
    pointLight1.position.set(2, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x87ceeb, 1, 10);
    pointLight2.position.set(-2, -2, 2);
    scene.add(pointLight2);

    // Particles for magical effect
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;

      const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.8);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Animation
    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01;

      // Rotate the card gently
      card.rotation.y = Math.sin(time) * 0.1;
      card.rotation.x = Math.cos(time * 0.7) * 0.05;
      border.rotation.copy(card.rotation);

      // Animate hearts
      hearts.forEach((heart, index) => {
        heart.rotation.z += 0.02;
        heart.position.y += Math.sin(time * 2 + index) * 0.01;
        heart.position.x += Math.cos(time * 1.5 + index) * 0.005;
      });

      // Animate particles
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += 0.005;

      // Animate lights
      pointLight1.position.x = Math.cos(time) * 3;
      pointLight1.position.z = Math.sin(time) * 3;
      pointLight2.position.x = Math.cos(time + Math.PI) * 3;
      pointLight2.position.z = Math.sin(time + Math.PI) * 3;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Show message after a short delay
    setTimeout(() => setShowMessage(true), 1000);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Scene */}
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Message overlay */}
      {showMessage && (
        <div
          style={{
            position: 'relative',
            zIndex: 1001,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '40px',
            borderRadius: '20px',
            maxWidth: '600px',
            margin: '20px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 105, 180, 0.3)',
            animation: 'fadeInScale 1s ease-out',
          }}
        >
          <pre
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#2c3e50',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontWeight: '400',
            }}
          >
            {birthdayMessage}
          </pre>

          <button
            onClick={onClose}
            style={{
              marginTop: '30px',
              padding: '15px 30px',
              background: 'linear-gradient(45deg, #ff69b4, #87ceeb)',
              border: 'none',
              borderRadius: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(255, 105, 180, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 25px rgba(255, 105, 180, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 105, 180, 0.3)';
            }}
          >
            ✨ Back to Celebration ✨
          </button>
        </div>
      )}

      {/* CSS animations */}
      <style>
        {`
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
