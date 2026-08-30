'use client';

import React, { useEffect, useRef } from 'react';

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(65, Math.floor((width * height) / 18000));
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      baseAlpha: number;
    }[] = [];

    const colors = [
      '#00f0ff', // Electric Cyan
      '#38bdf8', // Sky
      '#818cf8', // Indigo
      '#a855f7', // Purple
      '#06b6d4', // Teal
    ];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.5 + 0.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: baseAlpha,
        baseAlpha,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Dark space background gradient
      const bgGradient = ctx.createRadialGradient(
        mouseX,
        mouseY,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      bgGradient.addColorStop(0.5, 'rgba(8, 14, 28, 0.2)');
      bgGradient.addColorStop(1, 'rgba(3, 7, 18, 0.85)');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Connect particles with cyber lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Proximity to mouse
        const dxMouse = mouseX - p1.x;
        const dyMouse = mouseY - p1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 180) {
          p1.alpha = Math.min(1, p1.baseAlpha + (1 - distMouse / 180) * 0.5);
          // slight repel/attract
          p1.x += (dxMouse / distMouse) * 0.2;
          p1.y += (dyMouse / distMouse) * 0.2;
        } else {
          p1.alpha = p1.baseAlpha;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p1.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Cyber Grid Lines overlay */}
      <div className="absolute inset-0 cyber-grid-bg opacity-40 pointer-events-none" />
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      {/* Bottom Ambient Glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
    </div>
  );
}
