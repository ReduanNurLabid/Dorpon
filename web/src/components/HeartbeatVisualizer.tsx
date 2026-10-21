import React, { useEffect, useRef } from 'react';

interface HeartbeatVisualizerProps {
  analyser?: AnalyserNode | null;
  isPlaying: boolean;
  scale?: number;
}

export const HeartbeatVisualizer: React.FC<HeartbeatVisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Visualizer bar parameters matching Voice Studio
      const barWidth = 4;
      const barGap = 3;
      const totalBarStep = barWidth + barGap;
      const halfBars = Math.floor((cx - 8) / totalBarStep);

      phase += isPlaying ? 0.05 : 0.03;

      let hasRealAudio = false;
      let sumEnergy = 0;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        const sampleCount = Math.min(16, dataArray.length);
        for (let i = 0; i < sampleCount; i++) sumEnergy += dataArray[i];
        if (sumEnergy > 8) {
          hasRealAudio = true;
        }
      }

      if (isPlaying) {
        // Energy from real voice or organic cardiac rhythm
        const avgEnergy = hasRealAudio 
          ? (sumEnergy / (16 * 255)) 
          : (0.3 + 0.28 * Math.abs(Math.sin(phase * 2.2)));
        
        const breathScale = 1.0 + 0.25 * Math.sin(phase * 1.5);

        // Radiant center breathing glow
        const glowRadius = Math.min(width / 2, 70 + avgEnergy * 95);
        const centerGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowRadius);
        centerGlow.addColorStop(0, `rgba(52, 211, 153, ${0.4 + avgEnergy * 0.45})`);
        centerGlow.addColorStop(0.5, `rgba(90, 240, 179, ${0.18 + avgEnergy * 0.25})`);
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, width, height);

        const step = Math.max(1, Math.floor(dataArray.length / halfBars));

        // Symmetrical expansion from center outward with Gaussian bell decay
        for (let i = 0; i < halfBars; i++) {
          let percent = 0;
          if (hasRealAudio) {
            const rawVal = dataArray[i * step] || 15;
            percent = Math.max(0.1, rawVal / 255);
          } else {
            // Heartbeat ECG pulse wave radiating outward from center
            const normDist = i / halfBars;
            const ecgWave = Math.sin(phase * 3 - normDist * 5.5);
            percent = Math.max(0.12, 0.28 + 0.62 * Math.pow(Math.max(0, ecgWave), 2));
          }

          const normDist = i / (halfBars * 0.72);
          const bellDecay = Math.exp(-Math.pow(normDist, 2));

          // Bold, dynamic bar heights that scale with the voice
          const barHeight = Math.max(6, percent * (height - 10) * bellDecay * breathScale);
          const y = cy - (barHeight / 2);

          const xRight = cx + (i * totalBarStep) + (barGap / 2);
          const xLeft = cx - ((i + 1) * totalBarStep) + (barGap / 2);

          const colorRatio = i / halfBars;
          let barColor: string;
          if (colorRatio < 0.25) {
            barColor = '#5AF0B3'; // Bright Mint
          } else if (colorRatio < 0.6) {
            barColor = '#34D399'; // Emerald
          } else {
            barColor = 'rgba(52, 211, 153, 0.5)'; // Soft Sage
          }

          ctx.fillStyle = barColor;

          // Right bar
          ctx.beginPath();
          ctx.roundRect(xRight, y, barWidth, barHeight, 2.5);
          ctx.fill();

          // Left bar (mirrored symmetry)
          ctx.beginPath();
          ctx.roundRect(xLeft, y, barWidth, barHeight, 2.5);
          ctx.fill();
        }

        // Center respiratory pulse pip
        const pipVal = hasRealAudio ? (dataArray[0] / 255) : (0.55 + 0.4 * Math.sin(phase * 3.5));
        const pipHeight = Math.max(14, pipVal * (height - 6));
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#5AF0B3';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(cx - 1.5, cy - (pipHeight / 2), 3, pipHeight, 1.5);
        ctx.fill();
        ctx.shadowBlur = 0;

      } else {
        // Organic Resting Breathing Rhythm (Lungs inhaling & exhaling)
        const breathWave = Math.sin(phase);
        const breathExpansion = (breathWave + 1) / 2;

        const idleGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 + breathExpansion * 45);
        idleGlow.addColorStop(0, `rgba(52, 211, 153, ${0.15 + breathExpansion * 0.25})`);
        idleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = idleGlow;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < halfBars; i++) {
          const normDist = i / halfBars;
          const ripple = Math.sin(phase - normDist * 2.4);
          const localExpansion = Math.max(0, (ripple + 1) / 2);

          const bellDecay = Math.exp(-Math.pow(normDist / 0.62, 2));
          const barHeight = Math.max(5, 6 + (localExpansion * bellDecay * (height * 0.52)));
          const y = cy - (barHeight / 2);

          const xRight = cx + (i * totalBarStep) + (barGap / 2);
          const xLeft = cx - ((i + 1) * totalBarStep) + (barGap / 2);

          const alpha = 0.2 + 0.42 * bellDecay * localExpansion;
          ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;

          ctx.beginPath();
          ctx.roundRect(xRight, y, barWidth, barHeight, 2);
          ctx.fill();

          ctx.beginPath();
          ctx.roundRect(xLeft, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [analyser, isPlaying]);

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
