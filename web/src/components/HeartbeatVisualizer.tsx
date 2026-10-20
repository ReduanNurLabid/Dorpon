import React, { useEffect, useRef } from 'react';

interface HeartbeatVisualizerProps {
  isPlaying: boolean;
  scale?: number;
}

export const HeartbeatVisualizer: React.FC<HeartbeatVisualizerProps> = ({ isPlaying, scale = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    let heartbeatPhase = 0;

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Bar settings
      const barWidth = 3.5;
      const barGap = 3;
      const totalStep = barWidth + barGap;
      const halfBars = Math.floor((cx - 10) / totalStep);

      phase += isPlaying ? 0.05 : 0.02;
      heartbeatPhase += isPlaying ? 0.06 : 0.02;

      // Respiratory expansion multiplier
      const breathingPulse = isPlaying ? 1.0 + 0.25 * Math.sin(phase * 1.5) : 0.8;
      const activeScale = isPlaying ? (scale || 1.0) : 0.6;

      // Radial ambient center glow
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70 * (isPlaying ? 1.2 : 0.8));
      glow.addColorStop(0, isPlaying ? 'rgba(52, 211, 153, 0.28)' : 'rgba(52, 211, 153, 0.08)');
      glow.addColorStop(0.5, isPlaying ? 'rgba(90, 240, 179, 0.12)' : 'rgba(52, 211, 153, 0.03)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Render symmetrical bars from center outward with ECG heartbeat curve
      for (let i = 0; i < halfBars; i++) {
        const normDist = i / (halfBars * 0.7);
        const bellDecay = Math.exp(-Math.pow(normDist, 2));

        // Heartbeat wave pulse in center (ECG spike)
        let ecgBoost = 1.0;
        if (i < 8 && isPlaying) {
          const ecgSin = Math.sin(heartbeatPhase * 2 - (i * 0.4));
          ecgBoost = 1.0 + Math.max(0, ecgSin * 1.2);
        }

        // Calculate height
        const baseH = isPlaying ? 24 : 10;
        const animatedH = Math.sin(phase + i * 0.25) * 8;
        const barHeight = Math.max(
          4,
          (baseH + animatedH) * bellDecay * breathingPulse * activeScale * ecgBoost
        );

        const y = cy - barHeight / 2;
        const xRight = cx + (i * totalStep) + (barGap / 2);
        const xLeft = cx - ((i + 1) * totalStep) + (barGap / 2);

        // Color gradation: Emerald center -> Soft Mint mid -> Deep Sage edge
        const colorRatio = i / halfBars;
        let barColor = 'rgba(52, 211, 153, 0.85)';
        if (colorRatio < 0.25) {
          barColor = isPlaying ? '#5AF0B3' : 'rgba(52, 211, 153, 0.6)';
        } else if (colorRatio < 0.6) {
          barColor = isPlaying ? '#34D399' : 'rgba(52, 211, 153, 0.4)';
        } else {
          barColor = isPlaying ? 'rgba(142, 159, 151, 0.5)' : 'rgba(142, 159, 151, 0.2)';
        }

        ctx.fillStyle = barColor;

        // Draw Right bar
        ctx.beginPath();
        ctx.roundRect(xRight, y, barWidth, barHeight, 2);
        ctx.fill();

        // Draw Left bar (Mirrored)
        ctx.beginPath();
        ctx.roundRect(xLeft, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      // Center Heartbeat Dot / Pulse
      if (isPlaying) {
        const pulseSize = 4 * (1.0 + 0.3 * Math.sin(heartbeatPhase * 3));
        ctx.beginPath();
        ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = '#5AF0B3';
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, scale]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <canvas
        ref={canvasRef}
        width={480}
        height={96}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
};
