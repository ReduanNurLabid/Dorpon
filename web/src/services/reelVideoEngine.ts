// 13-Second Motion News Reel Video Engine (60 FPS) for Sondesh Express

export interface ReelRenderOptions {
  aspectRatio: '9:16' | '4:5';
  durationSeconds?: number; // Default 13.0
  fps?: number; // Default 60
  includeAudio?: boolean;
  lang: 'bn' | 'en';
  tone: 'positive' | 'critical';
  headline: string;
  keyPoints: string[];
  sourceName: string;
  categoryName: string;
  imageElement: HTMLImageElement | null;
  imageBrightness?: number;
  logoElement?: HTMLImageElement | null;
  fontFamily?: string;
  isJustified?: boolean;
  headlineSize?: number;
  bulletSize?: number;
  onProgress?: (progress: number, currentTimeSec: number) => void;
}

export interface ReelRenderResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Renders a line of text on canvas, justifying words across maxLineWidth if isJustified is true.
 * For the last line of a paragraph or 1-word lines, renders standard left-aligned.
 */
export function renderJustifiedLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  maxLineWidth: number,
  isJustified: boolean,
  isLastLine: boolean
): void {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (!isJustified || isLastLine || words.length <= 1) {
    ctx.fillText(line, x, y);
    return;
  }

  let totalWordsWidth = 0;
  const wordWidths: number[] = [];
  for (const w of words) {
    const wWidth = ctx.measureText(w).width;
    wordWidths.push(wWidth);
    totalWordsWidth += wWidth;
  }

  const remainingSpace = maxLineWidth - totalWordsWidth;
  const spaceCount = words.length - 1;
  const spaceWidth = spaceCount > 0 ? remainingSpace / spaceCount : 0;
  const normalSpaceWidth = ctx.measureText(' ').width;

  // Fallback to normal spacing if spacing would look unnaturally sparse
  if (spaceWidth > normalSpaceWidth * 3.5 || spaceWidth < 0) {
    ctx.fillText(line, x, y);
    return;
  }

  let currentX = x;
  for (let i = 0; i < words.length; i++) {
    ctx.fillText(words[i], currentX, y);
    currentX += wordWidths[i] + spaceWidth;
  }
}

/**
 * Creates a synthesized, sleek newsroom ambient drone tone using Web Audio API.
 */
function createAmbientAudioTrack(durationSec: number): {
  audioContext: AudioContext;
  audioTrack: MediaStreamTrack | null;
  stopAudio: () => void;
} {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) {
      return { audioContext: null as any, audioTrack: null, stopAudio: () => {} };
    }

    const audioCtx = new AudioCtxClass();
    const destination = audioCtx.createMediaStreamDestination();

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    // Smooth fade in over 1.5 seconds
    masterGain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 1.5);
    // Steady until 8.5 seconds
    masterGain.gain.setValueAtTime(0.18, audioCtx.currentTime + durationSec - 1.5);
    // Smooth fade out at the end
    masterGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);
    masterGain.connect(destination);

    // Warm Low-pass Filter for newsroom depth
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, audioCtx.currentTime);
    filter.connect(masterGain);

    // Oscillator 1: Root note (C2 ~65.4 Hz)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(65.4, audioCtx.currentTime);
    osc1.connect(filter);

    // Oscillator 2: Fifth harmonic (G2 ~98.0 Hz)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(98.0, audioCtx.currentTime);
    osc2.connect(filter);

    // Oscillator 3: Soft subtle octave (C3 ~130.8 Hz) with rhythmic LFO swell
    const osc3 = audioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(130.8, audioCtx.currentTime);

    const osc3Gain = audioCtx.createGain();
    osc3Gain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    // LFO for slow ambient breathing (0.3 Hz)
    const lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.3, audioCtx.currentTime);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc3Gain.gain);

    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    const stopAudio = () => {
      try {
        osc1.stop();
        osc2.stop();
        osc3.stop();
        lfo.stop();
        audioCtx.close();
      } catch (e) {
        // Ignored
      }
    };

    const audioTrack = destination.stream.getAudioTracks()[0] || null;
    return { audioContext: audioCtx, audioTrack, stopAudio };
  } catch (err) {
    console.warn('Could not initialize Web Audio track:', err);
    return { audioContext: null as any, audioTrack: null, stopAudio: () => {} };
  }
}

interface LayoutCache {
  key: string;
  actualBulletFontSize: number;
  bulletLineHeight: number;
  wrappedBullets: string[][];
  cardHeights: number[];
  cardsTotalHeight: number;
  cardsStartY: number;
  actualHeadlineFontSize: number;
  headlineLineHeight: number;
  finalHeadlineLines: string[];
  headlineStartY: number;
}

let cachedLayout: LayoutCache | null = null;

/**
 * Renders a single frame of the 13-second Reel animation at timestamp t (0.0 to 13.0).
 */
export function drawReelFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  options: ReelRenderOptions
): void {
  const {
    aspectRatio = '9:16',
    lang,
    tone,
    fontFamily,
    isJustified = true,
    headline,
    keyPoints,
    sourceName,
    categoryName,
    imageElement,
    imageBrightness = 105,
    logoElement,
    headlineSize = 62,
    bulletSize = 34,
  } = options;

  const isBn = lang === 'bn';
  const isPositive = tone === 'positive';
  const accentColor = isPositive ? '#00c875' : '#ff4d4d';
  const activeFont = fontFamily || (isBn ? 'Hind Siliguri' : 'Lora');

  // 1. Clear Frame
  ctx.fillStyle = '#0b0c0d';
  ctx.fillRect(0, 0, width, height);

  // ==========================================
  // TEXT & CARD DIMENSION PRE-CALCULATIONS (CACHED FOR 60 FPS PERFORMANCE)
  // ==========================================
  const footerY = height - 60;
  const boxBottomY = footerY - 24;
  const boxX = 54;
  const boxW = width - 108;

  const actualBulletFontSize = isBn ? bulletSize : bulletSize - 2;
  const bulletLineHeight = Math.round(actualBulletFontSize * 1.5);
  const maxBulletWidth = boxW - 100;

  let actualHeadlineFontSize = isBn ? headlineSize : headlineSize - 4;
  if (headline.length > 70) actualHeadlineFontSize = Math.max(46, actualHeadlineFontSize - 6);
  if (headline.length > 105) actualHeadlineFontSize = Math.max(40, actualHeadlineFontSize - 10);
  const headlineLineHeight = Math.round(actualHeadlineFontSize * 1.3);

  const cacheKey = `${width}_${height}_${activeFont}_${headline}_${actualHeadlineFontSize}_${actualBulletFontSize}_${keyPoints.join('||')}`;

  let layout = cachedLayout;
  if (!layout || layout.key !== cacheKey) {
    ctx.font = `600 ${actualBulletFontSize}px "${activeFont}", "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
    const visiblePoints = keyPoints.slice(0, 3).filter((pt) => pt.trim().length > 0);
    const wrappedBullets: string[][] = [];

    for (const pt of visiblePoints) {
      const ptWords = pt.split(' ');
      let bLine = '';
      const bLines: string[] = [];
      for (let w = 0; w < ptWords.length; w++) {
        const testB = bLine + ptWords[w] + ' ';
        const m = ctx.measureText(testB);
        if (m.width > maxBulletWidth && w > 0) {
          bLines.push(bLine.trim());
          bLine = ptWords[w] + ' ';
        } else {
          bLine = testB;
        }
      }
      bLines.push(bLine.trim());
      wrappedBullets.push(bLines);
    }

    let cardsTotalHeight = 0;
    const cardHeights: number[] = [];
    const cardGap = 16;
    const cardPaddingY = 36;

    for (const lines of wrappedBullets) {
      const cardH = cardPaddingY + lines.length * bulletLineHeight;
      cardHeights.push(cardH);
      cardsTotalHeight += cardH;
    }
    if (cardHeights.length > 1) {
      cardsTotalHeight += (cardHeights.length - 1) * cardGap;
    }

    const cardsStartY = boxBottomY - cardsTotalHeight;

    ctx.font = `bold ${actualHeadlineFontSize}px "${activeFont}", "Hind Siliguri", "Lora", serif`;
    const maxHeadlineWidth = width - 108;
    const headlineWords = headline.split(' ');
    let hLine = '';
    const headlineLines: string[] = [];

    for (let n = 0; n < headlineWords.length; n++) {
      const testLine = hLine + headlineWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxHeadlineWidth && n > 0) {
        headlineLines.push(hLine.trim());
        hLine = headlineWords[n] + ' ';
      } else {
        hLine = testLine;
      }
    }
    headlineLines.push(hLine.trim());
    const finalHeadlineLines = headlineLines.slice(0, 3);

    const headlineBottomY = cardsStartY - 30;
    const totalHeadlineH = (finalHeadlineLines.length - 1) * headlineLineHeight;
    const headlineStartY = headlineBottomY - totalHeadlineH;

    layout = {
      key: cacheKey,
      actualBulletFontSize,
      bulletLineHeight,
      wrappedBullets,
      cardHeights,
      cardsTotalHeight,
      cardsStartY,
      actualHeadlineFontSize,
      headlineLineHeight,
      finalHeadlineLines,
      headlineStartY,
    };
    cachedLayout = layout;
  }

  const {
    wrappedBullets,
    cardHeights,
    cardsStartY,
    finalHeadlineLines,
    headlineStartY,
  } = layout;
  const cardGap = 16;

  // ==========================================
  // 2. KEN BURNS PHOTO ZOOM (0.0s - 13.0s)
  // ==========================================
  // Scale smoothly from 1.00 to 1.09 over 13 seconds
  const totalDuration = options.durationSeconds || 13.0;
  const progressRatio = clamp(t / totalDuration, 0, 1);
  const kenBurnsScale = 1.0 + 0.09 * progressRatio; // Subtle, elegant cinematic zoom
  const panOffsetY = progressRatio * 18; // Slow micro-pan downwards

  const baseImgHeight = Math.max(height * 0.55, headlineStartY + 80);

  ctx.save();
  if (imageBrightness !== 100) {
    ctx.filter = `brightness(${imageBrightness}%) contrast(106%)`;
  }

  if (imageElement) {
    const imgRatio = imageElement.width / imageElement.height;
    const targetRatio = width / baseImgHeight;
    let sWidth = imageElement.width;
    let sHeight = imageElement.height;
    let sx = 0;
    let sy = 0;

    if (imgRatio > targetRatio) {
      sWidth = imageElement.height * targetRatio;
      sx = (imageElement.width - sWidth) / 2;
    } else {
      sHeight = imageElement.width / targetRatio;
      sy = (imageElement.height - sHeight) / 2;
    }

    // Apply Ken Burns zoom transform from center
    ctx.save();
    ctx.translate(width / 2, baseImgHeight / 2 + panOffsetY);
    ctx.scale(kenBurnsScale, kenBurnsScale);
    ctx.translate(-width / 2, -baseImgHeight / 2);
    ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, 0, 0, width, baseImgHeight);
    ctx.restore();
  } else {
    // Abstract dark geometric gradient
    const grad = ctx.createLinearGradient(0, 0, width, baseImgHeight);
    grad.addColorStop(0, '#15181a');
    grad.addColorStop(1, '#0e1012');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, baseImgHeight);
  }
  ctx.restore();

  // ==========================================
  // 3. SEAMLESS GRADIENTS & FADES
  // ==========================================
  // Top gradient for masthead
  const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
  topGrad.addColorStop(0, 'rgba(10, 11, 13, 0.95)');
  topGrad.addColorStop(0.6, 'rgba(10, 11, 13, 0.6)');
  topGrad.addColorStop(1, 'rgba(10, 11, 13, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 220);

  // Bottom fade calculated relative to headline anchor
  const fadeStartY = Math.max(200, headlineStartY - 240);
  const fadeEndY = headlineStartY - 16;
  const bottomFade = ctx.createLinearGradient(0, fadeStartY, 0, fadeEndY);
  bottomFade.addColorStop(0, 'rgba(11, 12, 13, 0)');
  bottomFade.addColorStop(0.25, 'rgba(11, 12, 13, 0.2)');
  bottomFade.addColorStop(0.55, 'rgba(11, 12, 13, 0.65)');
  bottomFade.addColorStop(0.85, 'rgba(11, 12, 13, 0.92)');
  bottomFade.addColorStop(1, '#0b0c0d');
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, fadeStartY, width, height - fadeStartY);

  // Side vignettes
  const leftFade = ctx.createLinearGradient(0, 0, 120, 0);
  leftFade.addColorStop(0, 'rgba(11, 12, 13, 0.55)');
  leftFade.addColorStop(1, 'rgba(11, 12, 13, 0)');
  ctx.fillStyle = leftFade;
  ctx.fillRect(0, 0, 120, baseImgHeight);

  const rightFade = ctx.createLinearGradient(width, 0, width - 120, 0);
  rightFade.addColorStop(0, 'rgba(11, 12, 13, 0.55)');
  rightFade.addColorStop(1, 'rgba(11, 12, 13, 0)');
  ctx.fillStyle = rightFade;
  ctx.fillRect(width - 120, 0, 120, baseImgHeight);

  // Card Outer Border (Subtle 1px frosted glow)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(32, 32, width - 64, height - 64, 16);
  ctx.stroke();

  // ==========================================
  // 4. ANIMATED MASTHEAD (0.0s - 1.2s Fade-In)
  // ==========================================
  const mastheadAlpha = clamp(t / 1.0, 0, 1);
  ctx.save();
  ctx.globalAlpha = mastheadAlpha;

  // Emblem [স]
  const emblemX = 54;
  const emblemY = 56;
  const emblemSize = 48;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 12);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (logoElement) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 12);
    ctx.clip();
    ctx.drawImage(logoElement, emblemX, emblemY, emblemSize, emblemSize);
    ctx.restore();
  } else {
    ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.fillText('স', emblemX + emblemSize / 2, emblemY + 34);
  }

  // Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
  ctx.fillText('সন্দেশ এক্সপ্রেস', emblemX + emblemSize + 14, emblemY + 28);

  // Verified Badge
  const brandW = ctx.measureText('সন্দেশ এক্সপ্রেস').width;
  const verifiedX = emblemX + emblemSize + 14 + brandW + 10;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(verifiedX + 10, emblemY + 20, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b0c0d';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓', verifiedX + 10, emblemY + 24);

  // Subtitle
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px "Space Grotesk", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.letterSpacing = '2px';
  ctx.fillText('SONDESH EXPRESS • DIGITAL GAZETTE', emblemX + emblemSize + 14, emblemY + 46);

  // Right date & category pill
  const formattedDate = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  ctx.font = 'bold 13px "Space Grotesk", "Hind Siliguri", sans-serif';
  ctx.letterSpacing = '0.5px';
  const rightCapsuleText = `${categoryName.toUpperCase()} • ${formattedDate}`;
  const rCapMetrics = ctx.measureText(rightCapsuleText);
  const rCapW = rCapMetrics.width + 24;
  const rCapX = width - 54 - rCapW;
  const rCapY = 64;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(rCapX, rCapY, rCapW, 32, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(rightCapsuleText, rCapX + rCapW / 2, rCapY + 21);
  ctx.restore();

  // ==========================================
  // 5. ANIMATED HEADLINE (0.2s - 1.6s)
  // ==========================================
  const headlineTime = clamp((t - 0.2) / 1.0, 0, 1);
  const headlineAlpha = easeOutCubic(headlineTime);
  const headlineSlideY = (1 - easeOutCubic(headlineTime)) * 20;

  ctx.save();
  ctx.globalAlpha = headlineAlpha;

  // Headline Lines
  ctx.font = `bold ${actualHeadlineFontSize}px "Hind Siliguri", "Lora", serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 18;

  let curHeadlineY = headlineStartY + headlineSlideY;
  for (let i = 0; i < finalHeadlineLines.length; i++) {
    ctx.fillText(finalHeadlineLines[i], 54, curHeadlineY);
    curHeadlineY += headlineLineHeight;
  }
  ctx.restore();

  // ==========================================
  // 6. SEQUENCED KEY POINT CARDS (2.0s, 4.5s, 7.0s)
  // ==========================================
  // Staggered trigger points (13-second timeline with 10.4s story window):
  // Card 0: starts at 1.6s, full by 2.3s
  // Card 1: starts at 4.4s, full by 5.1s
  // Card 2: starts at 7.2s, full by 7.9s (all 3 cards remain steady until 10.4s)
  const cardStartTimes = [1.6, 4.4, 7.2];
  const banglaDigits = ['০১', '০২', '০৩'];
  const englishDigits = ['01', '02', '03'];

  let curCardY = cardsStartY;

  for (let pIdx = 0; pIdx < wrappedBullets.length; pIdx++) {
    const bLines = wrappedBullets[pIdx];
    const cardH = cardHeights[pIdx];

    const cStart = cardStartTimes[pIdx] || (1.8 + pIdx * 2.4);
    const cardProgress = clamp((t - cStart) / 0.8, 0, 1);
    const cardAlpha = easeOutCubic(cardProgress);
    const cardSlideY = (1 - easeOutCubic(cardProgress)) * 24;

    if (cardAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = cardAlpha;

      const animatedY = curCardY + cardSlideY;

      // Card Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.beginPath();
      ctx.roundRect(boxX, animatedY, boxW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Numbered Badge
      const badgeW = 38;
      const badgeH = 32;
      const badgeX = boxX + 16;
      const badgeY = animatedY + 16;

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();

      ctx.font = 'bold 16px "Space Grotesk", "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#0b0c0d';
      ctx.textAlign = 'center';
      const numText = isBn ? (banglaDigits[pIdx] || `০${pIdx + 1}`) : (englishDigits[pIdx] || `0${pIdx + 1}`);
      ctx.fillText(numText, badgeX + badgeW / 2, badgeY + 22);

      // Bullet Text with Justification & Font Support
      ctx.textAlign = 'left';
      ctx.font = `600 ${actualBulletFontSize}px "${activeFont}", "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#ffffff';

      const bulletTextX = boxX + badgeW + 30;
      const bulletTextMaxW = boxW - badgeW - 50;
      let lineY = animatedY + 22 + actualBulletFontSize * 0.75;
      for (let l = 0; l < bLines.length; l++) {
        const isLastLine = l === bLines.length - 1;
        renderJustifiedLine(ctx, bLines[l], bulletTextX, lineY, bulletTextMaxW, isJustified, isLastLine);
        lineY += bulletLineHeight;
      }

      ctx.restore();
    }

    curCardY += cardH + cardGap;
  }

  // ==========================================
  // 7. ANIMATED AUTHORITY FOOTER BAR (Steady & Elegant - No harsh bottom flashing)
  // ==========================================
  const footerAlpha = clamp(t / 1.5, 0, 1);

  ctx.save();
  ctx.globalAlpha = footerAlpha;

  const footerBarY = footerY - 14;
  const footerBarH = 42;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.roundRect(boxX, footerBarY, boxW, footerBarH, 21);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left: Source
  ctx.font = '15px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  const srcText = isBn ? `📰 সূত্র: ${sourceName}` : `📰 Source: ${sourceName}`;
  ctx.fillText(srcText, boxX + 20, footerBarY + 26);

  // Center: Verified Handle
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('@sondeshexpress', width / 2 - 8, footerBarY + 26);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('✓', width / 2 + 64, footerBarY + 26);

  // Right: Web URL
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px "Space Grotesk", sans-serif';
  ctx.fillStyle = accentColor;
  ctx.fillText('sondesh.web.app ↗', boxX + boxW - 20, footerBarY + 26);
  ctx.restore();

  // ==========================================
  // 8. BRAND OUTRO STINGER (10.4s - 13.0s: 2.6s Total, >2.2s Steady Brand Hold)
  // Featuring Sondesh Logo, Follow Us Badge, and Website CTA
  // ==========================================
  const outroStart = 10.4;
  if (t >= outroStart) {
    const outroProgress = clamp((t - outroStart) / 0.28, 0, 1);
    const scrimAlpha = easeOutCubic(outroProgress) * 0.96;

    ctx.save();
    // 1. Dark frosted backdrop scrim with subtle depth
    ctx.fillStyle = `rgba(11, 12, 13, ${scrimAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // 2. Radial brand ambient glow centered on logo
    const isVertical = aspectRatio === '9:16';
    const logoCenterY = isVertical ? height * 0.43 : height * 0.41;
    const logoCenterX = width / 2;
    const logoSize = isVertical ? 340 : 260;
    const logoRadius = 32;

    const radialGlow = ctx.createRadialGradient(
      logoCenterX,
      logoCenterY,
      logoSize * 0.2,
      logoCenterX,
      logoCenterY,
      logoSize * 1.5
    );
    radialGlow.addColorStop(0, 'rgba(202, 254, 3, 0.18)');
    radialGlow.addColorStop(0.5, 'rgba(19, 43, 48, 0.25)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Stinger content entrance animation (snappy entrance by 10.75s, then rock-solid hold)
    const stingerAnimProgress = clamp((t - (outroStart + 0.05)) / 0.32, 0, 1);
    const stingerAlpha = easeOutCubic(stingerAnimProgress);
    const stingerScale = 0.88 + 0.12 * easeOutCubic(stingerAnimProgress);

    ctx.globalAlpha = stingerAlpha;

    // Draw the Logo Card
    ctx.save();
    ctx.translate(logoCenterX, logoCenterY);
    ctx.scale(stingerScale, stingerScale);

    const halfSize = logoSize / 2;

    // Outer subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 12;

    // Logo Card Background / Clipping
    ctx.beginPath();
    ctx.roundRect(-halfSize, -halfSize, logoSize, logoSize, logoRadius);
    ctx.fillStyle = '#132B30';
    ctx.fill();

    // Reset shadow before clipping/drawing image
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-halfSize, -halfSize, logoSize, logoSize, logoRadius);
    ctx.clip(); // clip inside rounded rect

    if (logoElement) {
      ctx.drawImage(logoElement, -halfSize, -halfSize, logoSize, logoSize);
    } else {
      // Fallback vector split presentation if image not loaded yet
      ctx.fillStyle = '#132B30';
      ctx.fillRect(-halfSize, -halfSize, halfSize, logoSize);
      ctx.fillStyle = '#CAFE03';
      ctx.fillRect(0, -halfSize, halfSize, logoSize);

      ctx.font = '900 48px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#CAFE03';
      ctx.fillText('SON', -halfSize / 2, 16);
      ctx.fillStyle = '#132B30';
      ctx.fillText('DESH', halfSize / 2, 16);
    }
    ctx.restore(); // end clip

    // Delicate border around logo card
    ctx.strokeStyle = 'rgba(202, 254, 3, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfSize, -halfSize, logoSize, logoSize, logoRadius);
    ctx.stroke();

    ctx.restore(); // end translate/scale

    // 4. Brand Name & Verification Badge
    const brandTextY = logoCenterY + halfSize + (isVertical ? 64 : 48);
    ctx.textAlign = 'center';
    ctx.font = `bold ${isVertical ? 46 : 38}px "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    const brandName = isBn ? 'সন্দেশ এক্সপ্রেস' : 'SONDESH EXPRESS';
    ctx.fillText(brandName, logoCenterX, brandTextY);

    // 5. Prominent "Follow Us" Action Pill + Social Handle
    const handleY = brandTextY + (isVertical ? 48 : 38);
    const followText = isBn ? '+ ফলো করুন' : '+ Follow Us';
    const handleText = '@sondeshexpress';

    ctx.font = `bold ${isVertical ? 17 : 15}px "Hind Siliguri", "Space Grotesk", sans-serif`;
    const followW = ctx.measureText(followText).width;
    ctx.font = `bold ${isVertical ? 19 : 16}px "Space Grotesk", sans-serif`;
    const handleW = ctx.measureText(handleText).width;

    const pillH = isVertical ? 42 : 36;
    const followBtnW = followW + 28;
    const pillW = followBtnW + handleW + 54;
    const pillX = logoCenterX - pillW / 2;
    const pillY = handleY - pillH / 2;

    // Outer frosted pill container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Vibrant Electric Lime "Follow Us" action button
    ctx.fillStyle = '#CAFE03'; // Sondesh Electric Lime
    ctx.beginPath();
    ctx.roundRect(pillX + 4, pillY + 4, followBtnW, pillH - 8, (pillH - 8) / 2);
    ctx.fill();

    ctx.fillStyle = '#132B30'; // Dark Teal
    ctx.font = `bold ${isVertical ? 17 : 15}px "Hind Siliguri", "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(followText, pillX + 4 + followBtnW / 2, pillY + pillH / 2 + (isBn ? 5 : 6));

    // Verified Handle alongside
    ctx.textAlign = 'left';
    ctx.font = `bold ${isVertical ? 19 : 16}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#ffffff';
    const handleStartX = pillX + followBtnW + 16;
    ctx.fillText(handleText, handleStartX, pillY + pillH / 2 + 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('✓', handleStartX + handleW + 6, pillY + pillH / 2 + 6);

    // 6. Tagline
    const taglineY = handleY + (isVertical ? 50 : 40);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const tagline = isBn
      ? 'সব খবর এক ঠিকানায় - কোলাহল এড়িয়ে, মূল কথায় চোখ রাখুন।'
      : 'One place for all. Cut the noise - read what really matters.';

    const baseTaglineSize = isVertical ? 22 : 18;
    ctx.font = `500 ${baseTaglineSize}px "${activeFont}", "Hind Siliguri", sans-serif`;
    const maxTaglineW = width - 120;
    const measuredTaglineW = ctx.measureText(tagline).width;
    if (measuredTaglineW > maxTaglineW) {
      const scaledSize = Math.max(14, Math.floor(baseTaglineSize * (maxTaglineW / measuredTaglineW)));
      ctx.font = `500 ${scaledSize}px "${activeFont}", "Hind Siliguri", sans-serif`;
    }
    ctx.fillText(tagline, logoCenterX, taglineY);

    // 7. High-Contrast Web CTA Button (Matching Logo's Lime & Teal)
    const ctaY = taglineY + (isVertical ? 64 : 50);
    const ctaW = isVertical ? 380 : 320;
    const ctaH = isVertical ? 60 : 52;
    const ctaX = logoCenterX - ctaW / 2;

    // Button glow
    ctx.shadowColor = 'rgba(202, 254, 3, 0.35)';
    ctx.shadowBlur = 24;

    ctx.fillStyle = '#CAFE03'; // Sondesh Electric Lime
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#132B30'; // Sondesh Dark Teal
    ctx.font = `bold ${isVertical ? 22 : 19}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('sondesh.web.app ↗', logoCenterX, ctaY + ctaH / 2 + 7);

    // 8. Footer prompt at bottom
    ctx.font = '14px "Hind Siliguri", "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.letterSpacing = '1px';
    const subPrompt = isBn ? 'নিয়মিত আপডেটের জন্য আমাদের ফলো করুন' : 'FOLLOW US FOR DAILY VERIFIED BRIEFINGS';
    ctx.fillText(subPrompt, logoCenterX, height - (isVertical ? 90 : 60));

    ctx.restore();
  }
}

/**
 * Executes the complete 13-second video recording at 60 FPS and compiles an MP4/WebM file.
 */
export async function renderAndExportReelVideo(options: ReelRenderOptions): Promise<ReelRenderResult> {
  const {
    aspectRatio,
    durationSeconds = 13.0,
    fps = 60,
    includeAudio = true,
    onProgress,
  } = options;

  const width = 1080;
  const height = aspectRatio === '9:16' ? 1920 : 1350;

  // Preload Sondesh Logo if not passed in options
  let resolvedLogo = options.logoElement;
  if (!resolvedLogo && typeof window !== 'undefined') {
    try {
      resolvedLogo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load /Sondesh_logo.png'));
        img.src = '/Sondesh_logo.png';
      });
    } catch {
      resolvedLogo = null;
    }
  }

  const activeOptions: ReelRenderOptions = {
    ...options,
    logoElement: resolvedLogo,
  };

  // Offscreen canvas for high-DPI rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context not available.');
  }

  // Draw initial frame
  drawReelFrame(ctx, width, height, 0, activeOptions);

  // Determine best supported video MIME type
  let mimeType = 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    mimeType = 'video/webm;codecs=vp9,opus';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    mimeType = 'video/webm';
  }

  const isMp4 = mimeType.includes('mp4');

  // Video Stream from Canvas
  const canvasStream = canvas.captureStream(fps);

  // Audio Stream
  let stopAudioFn = () => {};
  if (includeAudio) {
    const { audioTrack, stopAudio } = createAmbientAudioTrack(durationSeconds);
    stopAudioFn = stopAudio;
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }
  }

  // MediaRecorder setup
  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 8000000, // 8 Mbps for ultra-smooth 60fps 1080p quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise<ReelRenderResult>((resolve, reject) => {
    recorder.onstop = () => {
      stopAudioFn();
      const outputBlob = new Blob(chunks, { type: mimeType });
      const ext = isMp4 ? 'mp4' : 'webm';
      const cleanSlug = options.headline.slice(0, 16).replace(/[^\w\u0980-\u09FF]/g, '_');
      const filename = `sondesh-reel-60fps-${aspectRatio.replace(':', 'x')}-${cleanSlug}.${ext}`;
      resolve({
        blob: outputBlob,
        filename,
        mimeType,
      });
    };

    recorder.onerror = (e: any) => {
      stopAudioFn();
      reject(e.error || new Error('MediaRecorder recording failed.'));
    };

    recorder.start(100);

    const startTime = performance.now();
    const targetDurationMs = durationSeconds * 1000;
    let isFinished = false;

    function renderLoop() {
      if (isFinished) return;

      const now = performance.now();
      const elapsedMs = now - startTime;
      const currentTimeSec = Math.min(durationSeconds, elapsedMs / 1000);

      drawReelFrame(ctx!, width, height, currentTimeSec, activeOptions);

      const progress = Math.min(100, Math.round((currentTimeSec / durationSeconds) * 100));
      if (onProgress) {
        onProgress(progress, Number(currentTimeSec.toFixed(1)));
      }

      if (elapsedMs < targetDurationMs) {
        requestAnimationFrame(renderLoop);
      } else {
        isFinished = true;
        drawReelFrame(ctx!, width, height, durationSeconds, activeOptions);
        if (onProgress) {
          onProgress(100, durationSeconds);
        }
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 60);
      }
    }

    requestAnimationFrame(renderLoop);
  });
}
