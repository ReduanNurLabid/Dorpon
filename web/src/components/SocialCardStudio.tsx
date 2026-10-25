import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CapsuleStory } from '../types';
import { 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  X, 
  Image as ImageIcon, 
  Globe, 
  TrendingUp, 
  AlertTriangle,
  Key,
  ListPlus,
  Sun,
  ShieldCheck,
  Layers,
  Video,
  Film,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Lock,
  Unlock,
  Edit3,
  Sliders,
  AlignJustify,
  AlignLeft,
  Type,
  Clipboard
} from 'lucide-react';
import { refineSocialCardWithGemini, getHeuristicSocialContent } from '../services/geminiClient';
import { renderAndExportReelVideo, drawReelFrame, renderJustifiedLine } from '../services/reelVideoEngine';
import { loadSafeCanvasImage } from '../services/imageLoader';

export type StudioTab = 'photo' | 'video';

export interface SocialCardStudioProps {
  story: CapsuleStory;
  onClose: () => void;
  initialTab?: StudioTab;
}

export type CardTone = 'positive' | 'critical';
export type CardLanguage = 'bn' | 'en';
export type DesignVersion = 'v2' | 'v1';

export const SocialCardStudio: React.FC<SocialCardStudioProps> = ({ story, onClose, initialTab = 'photo' }) => {
  // Top-level Studio Tab: 'photo' (Social Photo Card) vs 'video' (10s Motion Reel)
  const [studioTab, setStudioTab] = useState<StudioTab>(initialTab);

  // Design Version Toggle: 'v2' (Next-Gen Upgrade) vs 'v1' (Classic Layout)
  const [designVersion, setDesignVersion] = useState<DesignVersion>('v2');

  // Theme & Language
  const [tone, setTone] = useState<CardTone>('positive');
  const [lang, setLang] = useState<CardLanguage>('bn');

  // Customized Font Family & Justification Alignment
  const [customFont, setCustomFont] = useState<string>('Hind Siliguri');
  const [isJustified, setIsJustified] = useState<boolean>(true);

  // Sync font when switching between Bangla and English
  useEffect(() => {
    if (lang === 'bn') {
      if (['Lora', 'Plus Jakarta Sans', 'Playfair Display', 'Space Grotesk'].includes(customFont)) {
        setCustomFont('Hind Siliguri');
      }
    } else {
      if (['Hind Siliguri', 'Anek Bangla', 'Noto Serif Bengali'].includes(customFont)) {
        setCustomFont('Lora');
      }
    }
  }, [lang]);

  // Typography font size settings (px on 1080x1350 canvas)
  const [headlineSize, setHeadlineSize] = useState<number>(62);
  const [bulletSize, setBulletSize] = useState<number>(34);

  // v2 Visual Tuning Controls
  const [imageBrightness, setImageBrightness] = useState<number>(105); // 80% to 150%

  // Text contents
  const [headline, setHeadline] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [sourceName, setSourceName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');

  // AI & Feedback
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('dorpon_gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  // 10-Second Motion News Reel Export States & Player
  const [isExportingReel, setIsExportingReel] = useState<boolean>(false);
  const [reelProgress, setReelProgress] = useState<number>(0);
  const [reelCurrentSec, setReelCurrentSec] = useState<number>(0);
  const [reelAspectRatio, setReelAspectRatio] = useState<'9:16' | '4:5'>('9:16');
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedFilename, setRenderedFilename] = useState<string>('');
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reel Customization Mode: 'edit' (unlocked, live end-result frame canvas) vs 'preview' (locked, video player)
  const [reelMode, setReelMode] = useState<'edit' | 'preview'>('edit');
  // In edit mode, allow switching preview between the Story Card frame (7.5s) and the Sondesh Logo Brand Outro (9.5s)
  const [videoPreviewStage, setVideoPreviewStage] = useState<'story' | 'outro'>('story');
  const reelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preload official Sondesh Logo (/Sondesh_logo.png)
  const sondeshLogoRef = useRef<HTMLImageElement | null>(null);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/Sondesh_logo.png';
    img.onload = () => {
      sondeshLogoRef.current = img;
      setLogoLoaded(true);
    };
    img.onerror = () => {
      console.warn('Could not load /Sondesh_logo.png');
    };
  }, []);

  // Clean up object URLs on unmount or before new renders
  useEffect(() => {
    return () => {
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
    };
  }, [renderedVideoUrl]);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const activeImageRef = useRef<HTMLImageElement | null>(null);

  // 1. Initialize Image URL & Source Attribution ONLY when story changes (preserves custom edits/pasted links on language switch)
  useEffect(() => {
    let src = 'Sondesh Desk';
    if (story.sources && story.sources.length > 0) {
      src = story.sources[0]?.name || (story.sources[0]?.url ? new URL(story.sources[0].url).hostname.replace('www.', '') : 'Sondesh Desk');
    }
    setSourceName(src);

    const img = story.image_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1080&auto=format&fit=crop&q=80';
    setImageUrl(img);
  }, [story.story_id]);

  // 2. Initialize or switch story copy (Headline, Key Points, Category) when language changes
  useEffect(() => {
    const isBn = lang === 'bn';
    const rawTitle = isBn
      ? story.daily_buzz?.title_bn || story.daily_buzz?.title_en || ''
      : story.daily_buzz?.title_en || story.daily_buzz?.title_bn || '';
    
    const rawSummary = isBn
      ? story.daily_buzz?.summary_bn || story.daily_buzz?.summary_en || ''
      : story.daily_buzz?.summary_en || story.daily_buzz?.summary_bn || '';

    const rawBullets = isBn
      ? story.daily_buzz?.bullets_bn || story.daily_buzz?.bullets_en || []
      : story.daily_buzz?.bullets_en || story.daily_buzz?.bullets_bn || [];

    const heuristic = getHeuristicSocialContent(rawTitle, rawSummary, rawBullets, lang, tone);

    setHeadline(heuristic.hookTitle);
    setKeyPoints(heuristic.keyPoints);
    
    // Category label & initial kicker tag
    const rawCat = story.primary_category || 'National';
    const categoryLabels: Record<string, { bn: string; en: string }> = {
      governance_law: { bn: 'শাসন ও কূটনীতি', en: 'Governance & Law' },
      economy_business: { bn: 'অর্থনীতি ও বাণিজ্য', en: 'Economy & Business' },
      world_diplomacy: { bn: 'আন্তর্জাতিক সংবাদ', en: 'World & Geopolitics' },
      tech_infrastructure: { bn: 'প্রযুক্তি ও উদ্ভাবন', en: 'Technology & AI' },
      climate_delta: { bn: 'পরিবেশ ও জলবায়ু', en: 'Climate & Environment' },
      society_education: { bn: 'সমাজ ও শিক্ষা', en: 'Society & Education' },
      sports_fitness: { bn: 'খেলাধুলা', en: 'Sports & Athletics' },
      national: { bn: 'জাতীয় সংবাদ', en: 'National Affairs' },
    };
    const catEntry = categoryLabels[rawCat] || { bn: 'বিশেষ প্রতিবেদন', en: 'Special Report' };
    const resolvedCat = isBn ? catEntry.bn : catEntry.en;
    setCategoryName(resolvedCat);
  }, [story.story_id, lang]);

  // Image Loading State & CORS Status Tracking
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [imageCorsStatus, setImageCorsStatus] = useState<'clean' | 'proxied' | 'preview_only' | 'error'>('clean');

  // Load Image for Canvas using Smart CORS bypass engine with proxy fallbacks
  useEffect(() => {
    let isCancelled = false;

    if (!imageUrl) {
      activeImageRef.current = null;
      setImageLoaded(true);
      setIsImageLoading(false);
      setImageCorsStatus('clean');
      return;
    }

    setIsImageLoading(true);

    loadSafeCanvasImage(imageUrl).then((result) => {
      if (isCancelled) return;
      activeImageRef.current = result.image;
      setImageCorsStatus(result.status);
      setImageLoaded(true);
      setIsImageLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [imageUrl]);

  // Support pasting image directly from clipboard (e.g. Snipping tool, Right-click Copy Image)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImageUrl(event.target.result as string);
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Handle local image upload
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas drawing routine (1080x1350 Portrait 4:5)
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    const isBn = lang === 'bn';
    const isPositive = tone === 'positive';
    const isV2 = designVersion === 'v2';

    // Theme color palette (Emerald for positive, Crimson for critical)
    const accentColor = isPositive ? '#00c875' : '#ff4d4d';
    const accentGlow = isPositive ? 'rgba(0, 200, 117, 0.25)' : 'rgba(255, 77, 77, 0.25)';

    // 1. Base dark background
    ctx.fillStyle = '#0b0c0d';
    ctx.fillRect(0, 0, width, height);

    // ==========================================
    // PRE-CALCULATE TEXT DIMENSIONS (BOTTOM-UP)
    // ==========================================
    const footerY = height - 56;
    const boxBottomY = footerY - 22; // Sits flush above the footer bar
    const boxX = 54;
    const boxW = width - 108;

    const activeFont = customFont || (isBn ? 'Hind Siliguri' : 'Lora');

    // A. Pre-wrap Key Points
    const actualBulletFontSize = isBn ? bulletSize : bulletSize - 2;
    const bulletLineHeight = Math.round(actualBulletFontSize * 1.5);
    const maxBulletWidth = isV2 ? boxW - 100 : boxW - 100;

    ctx.font = `600 ${actualBulletFontSize}px "${activeFont}", "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
    const visiblePoints = keyPoints.slice(0, 3).filter(pt => pt.trim().length > 0);
    const wrappedBullets: string[][] = [];
    let totalBulletLines = 0;

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
      wrappedBullets.push(bLines); // Keep all lines to prevent truncation!
      totalBulletLines += bLines.length;
    }

    // Heights calculation depending on design version (Spacious & breathable)
    let keyPointsTotalHeight = 0;
    const v2CardHeights: number[] = [];
    const v2CardGap = 16;
    const cardPaddingY = 36;

    if (isV2) {
      // Segmented individual cards
      for (const lines of wrappedBullets) {
        const cardH = cardPaddingY + (lines.length * bulletLineHeight);
        v2CardHeights.push(cardH);
        keyPointsTotalHeight += cardH;
      }
      if (v2CardHeights.length > 1) {
        keyPointsTotalHeight += (v2CardHeights.length - 1) * v2CardGap;
      }
    } else {
      // Classic single box
      const eyebrowH = 50;
      const bulletContentH = (totalBulletLines * bulletLineHeight) + (Math.max(0, wrappedBullets.length - 1) * 24);
      const boxPaddingBottom = 28;
      keyPointsTotalHeight = Math.max(140, eyebrowH + bulletContentH + boxPaddingBottom);
    }

    const keyPointsStartY = boxBottomY - keyPointsTotalHeight;

    // B. Pre-wrap Headline
    const maxHeadlineWidth = width - 108;
    let headlineFontSize = isBn ? headlineSize : headlineSize - 4;
    if (headline.length > 70) headlineFontSize = Math.max(46, headlineFontSize - 6);
    if (headline.length > 105) headlineFontSize = Math.max(40, headlineFontSize - 10);

    ctx.font = `bold ${headlineFontSize}px "${activeFont}", "Hind Siliguri", "Lora", serif`;
    const headlineLineHeight = Math.round(headlineFontSize * 1.3);
    const headlineWords = headline.split(' ');
    let line = '';
    const headlineLines: string[] = [];

    for (let n = 0; n < headlineWords.length; n++) {
      const testLine = line + headlineWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxHeadlineWidth && n > 0) {
        headlineLines.push(line.trim());
        line = headlineWords[n] + ' ';
      } else {
        line = testLine;
      }
    }
    headlineLines.push(line.trim());
    const finalHeadlineLines = headlineLines.slice(0, 3);

    // Headline bottom sits right above key points with comfortable breathing room
    const headlineBottomY = keyPointsStartY - 28;
    const totalHeadlineH = (finalHeadlineLines.length - 1) * headlineLineHeight;
    const headlineStartY = headlineBottomY - totalHeadlineH;

    // ==========================================
    // 2. FEATURED IMAGE (Upper Canvas Area)
    // ==========================================
    const imgHeight = Math.max(760, headlineStartY + 80);
    
    ctx.save();
    if (isV2 && imageBrightness !== 100) {
      ctx.filter = `brightness(${imageBrightness}%) contrast(105%)`;
    }

    if (activeImageRef.current) {
      const img = activeImageRef.current;
      const imgRatio = img.width / img.height;
      const targetRatio = width / imgHeight;
      let sWidth = img.width;
      let sHeight = img.height;
      let sx = 0;
      let sy = 0;

      if (imgRatio > targetRatio) {
        sWidth = img.height * targetRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / targetRatio;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, imgHeight);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, imgHeight);
      grad.addColorStop(0, '#15181a');
      grad.addColorStop(1, '#0e1012');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, imgHeight);

      ctx.fillStyle = accentGlow;
      ctx.beginPath();
      ctx.arc(width / 2, imgHeight / 2, 280, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // 3. SEAMLESS GRADIENT FADES
    // ==========================================
    // Top gradient for masthead readability
    const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
    topGrad.addColorStop(0, 'rgba(10, 11, 13, 0.95)');
    topGrad.addColorStop(0.6, 'rgba(10, 11, 13, 0.6)');
    topGrad.addColorStop(1, 'rgba(10, 11, 13, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 220);

    // Bottom fade calculated relative to text anchor
    const textAnchorY = headlineStartY;
    const fadeStartY = Math.max(200, textAnchorY - 260);
    const fadeEndY = textAnchorY - 12;
    const bottomFade = ctx.createLinearGradient(0, fadeStartY, 0, fadeEndY);
    bottomFade.addColorStop(0, 'rgba(11, 12, 13, 0)');
    bottomFade.addColorStop(0.25, 'rgba(11, 12, 13, 0.2)');
    bottomFade.addColorStop(0.55, 'rgba(11, 12, 13, 0.65)');
    bottomFade.addColorStop(0.85, 'rgba(11, 12, 13, 0.92)');
    bottomFade.addColorStop(1, '#0b0c0d');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, fadeStartY, width, height - fadeStartY);

    // Subtle side vignette feathering
    const leftFade = ctx.createLinearGradient(0, 0, 120, 0);
    leftFade.addColorStop(0, 'rgba(11, 12, 13, 0.55)');
    leftFade.addColorStop(1, 'rgba(11, 12, 13, 0)');
    ctx.fillStyle = leftFade;
    ctx.fillRect(0, 0, 120, imgHeight);

    const rightFade = ctx.createLinearGradient(width, 0, width - 120, 0);
    rightFade.addColorStop(0, 'rgba(11, 12, 13, 0.55)');
    rightFade.addColorStop(1, 'rgba(11, 12, 13, 0)');
    ctx.fillStyle = rightFade;
    ctx.fillRect(width - 120, 0, 120, imgHeight);

    // ==========================================
    // 4. CARD FRAMING
    // ==========================================
    if (isV2) {
      // Modern subtle border without dated HUD brackets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(32, 32, width - 64, height - 64, 16);
      ctx.stroke();
    } else {
      // Classic outer framing with corner brackets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      const bracketSize = 24;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(36, 36 + bracketSize); ctx.lineTo(36, 36); ctx.lineTo(36 + bracketSize, 36);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(width - 36 - bracketSize, 36); ctx.lineTo(width - 36, 36); ctx.lineTo(width - 36, 36 + bracketSize);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(36, height - 36 - bracketSize); ctx.lineTo(36, height - 36); ctx.lineTo(36 + bracketSize, height - 36);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(width - 36 - bracketSize, height - 36); ctx.lineTo(width - 36, height - 36); ctx.lineTo(width - 36, height - 36 - bracketSize);
      ctx.stroke();
    }

    // ==========================================
    // 5. MASTHEAD HEADER
    // ==========================================
    const formattedDate = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (isV2) {
      // UPGRADED NEXT-GEN MASTHEAD
      ctx.save();
      // Emblem icon [স]
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

      if (sondeshLogoRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 12);
        ctx.clip();
        ctx.drawImage(sondeshLogoRef.current, emblemX, emblemY, emblemSize, emblemSize);
        ctx.restore();
      } else {
        ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'center';
        ctx.fillText('স', emblemX + emblemSize / 2, emblemY + 34);
      }

      // Brand Title + Verified Badge
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.fillText('সন্দেশ এক্সপ্রেস', emblemX + emblemSize + 14, emblemY + 28);

      // Verified checkmark icon
      const brandWidth = ctx.measureText('সন্দেশ এক্সপ্রেস').width;
      const verifiedX = emblemX + emblemSize + 14 + brandWidth + 10;
      ctx.fillStyle = '#38bdf8'; // Verified blue
      ctx.beginPath();
      ctx.arc(verifiedX + 10, emblemY + 20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0c0d';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', verifiedX + 10, emblemY + 24);

      // English sub-brand
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.letterSpacing = '2px';
      ctx.fillText('SONDESH EXPRESS • DIGITAL GAZETTE', emblemX + emblemSize + 14, emblemY + 46);

      // Right: Date & Desk Capsule
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
    } else {
      // CLASSIC MASTHEAD (v1)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.fillText('সন্দেশ এক্সপ্রেস', 64, 88);

      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.letterSpacing = '3px';
      ctx.fillText('SONDESH EXPRESS', 64, 114);

      ctx.font = 'bold 15px "Space Grotesk", "Hind Siliguri", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'right';
      ctx.fillText(formattedDate, width - 64, 86);

      const catText = categoryName.toUpperCase();
      ctx.font = 'bold 13px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      const catMetrics = ctx.measureText(catText);
      const catBoxW = catMetrics.width + 24;
      const catBoxX = width - 64 - catBoxW;
      const catBoxY = 100;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(catBoxX, catBoxY, catBoxW, 28, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(catText, catBoxX + catBoxW / 2, catBoxY + 18);
      ctx.restore();
    }

    // ==========================================
    // 6. BOLD HEADLINE
    // ==========================================
    ctx.save();
    ctx.font = `bold ${headlineFontSize}px "Hind Siliguri", "Lora", serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 18;

    let curHeadlineY = headlineStartY;
    for (let i = 0; i < finalHeadlineLines.length; i++) {
      ctx.fillText(finalHeadlineLines[i], 54, curHeadlineY);
      curHeadlineY += headlineLineHeight;
    }
    ctx.restore();

    // ==========================================
    // 7. KEY POINTS PRESENTATION
    // ==========================================
    ctx.save();
    if (isV2) {
      // NEXT-GEN V2: SEGMENTED FLOATING FACT CARDS
      let curCardY = keyPointsStartY;
      const banglaDigits = ['০১', '০২', '০৩'];
      const englishDigits = ['01', '02', '03'];

      for (let pIdx = 0; pIdx < wrappedBullets.length; pIdx++) {
        const bLines = wrappedBullets[pIdx];
        const cardH = v2CardHeights[pIdx];

        // Frosted Glass Card Body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.beginPath();
        ctx.roundRect(boxX, curCardY, boxW, cardH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Left Numbered Pill Badge
        const badgeW = 38;
        const badgeH = 32;
        const badgeX = boxX + 16;
        const badgeY = curCardY + 16;

        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
        ctx.fill();

        ctx.font = 'bold 16px "Space Grotesk", "Hind Siliguri", sans-serif';
        ctx.fillStyle = '#0b0c0d'; // Deep contrast against emerald/crimson
        ctx.textAlign = 'center';
        const numText = isBn ? (banglaDigits[pIdx] || `০${pIdx + 1}`) : (englishDigits[pIdx] || `0${pIdx + 1}`);
        ctx.fillText(numText, badgeX + badgeW / 2, badgeY + 22);

        // Bullet Text with Justification & Font Support
        ctx.textAlign = 'left';
        ctx.font = `600 ${actualBulletFontSize}px "${activeFont}", "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#ffffff';

        const bulletTextX = boxX + badgeW + 30;
        const bulletTextMaxW = boxW - badgeW - 50;
        let lineY = curCardY + 22 + (actualBulletFontSize * 0.75);
        for (let l = 0; l < bLines.length; l++) {
          const isLastLine = l === bLines.length - 1;
          renderJustifiedLine(ctx, bLines[l], bulletTextX, lineY, bulletTextMaxW, isJustified, isLastLine);
          lineY += bulletLineHeight;
        }

        curCardY += cardH + v2CardGap;
      }
    } else {
      // CLASSIC V1: SINGLE CONTINUOUS GLASS BOX
      const boxY = keyPointsStartY;
      const boxH = keyPointsTotalHeight;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, 8, boxH, [14, 0, 0, 14]);
      ctx.fill();

      const keyPointsHeader = isBn ? 'মূল বিষয়সমূহ ও সারসংক্ষেপ' : 'KEY DEVELOPMENTS & HIGHLIGHTS';
      ctx.font = 'bold 18px "Space Grotesk", "Hind Siliguri", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.letterSpacing = '1.5px';
      ctx.fillText(keyPointsHeader, boxX + 32, boxY + 40);

      ctx.font = `600 ${actualBulletFontSize}px "${activeFont}", "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '0px';

      let bulletY = boxY + 86;
      const v1BulletMaxW = boxW - 100;
      for (let pIdx = 0; pIdx < wrappedBullets.length; pIdx++) {
        const bLines = wrappedBullets[pIdx];

        ctx.save();
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 24px "Space Grotesk", sans-serif';
        ctx.fillText('◆', boxX + 30, bulletY - 2);
        ctx.restore();

        for (let l = 0; l < bLines.length; l++) {
          const isLastLine = l === bLines.length - 1;
          renderJustifiedLine(ctx, bLines[l], boxX + 70, bulletY, v1BulletMaxW, isJustified, isLastLine);
          bulletY += bulletLineHeight;
        }

        bulletY += 24;
      }
    }
    ctx.restore();

    // ==========================================
    // 8. FOOTER BAR
    // ==========================================
    ctx.save();
    if (isV2) {
      // NEXT-GEN V2 UNIFIED AUTHORITY FOOTER
      const footerBarY = footerY - 14;
      const footerBarH = 42;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(boxX, footerBarY, boxW, footerBarH, 21);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
    } else {
      // CLASSIC V1 FOOTER
      ctx.font = '18px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      const srcText = isBn ? `সূত্র: ${sourceName}` : `Source: ${sourceName}`;
      ctx.fillText(srcText, 54, footerY);

      ctx.textAlign = 'right';
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('@sondeshexpress • sondesh.web.app', width - 54, footerY);
    }
    ctx.restore();
  }, [
    lang, 
    tone, 
    headline, 
    keyPoints, 
    sourceName, 
    categoryName, 
    imageLoaded, 
    headlineSize, 
    bulletSize,
    designVersion,
    imageBrightness,
    customFont,
    isJustified
  ]);

  // Redraw card canvas whenever dependencies change
  useEffect(() => {
    if (studioTab === 'photo') {
      drawCard();
    }
  }, [studioTab, drawCard]);

  // Render the live end-result frame (Story Frame at t = 7.5s vs Brand Outro Frame at t = 9.5s) for the Video Reel canvas
  const drawReelPreviewFrame = useCallback(() => {
    const canvas = reelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = reelAspectRatio === '9:16' ? 1920 : 1350;
    canvas.width = width;
    canvas.height = height;

    const previewTimestamp = videoPreviewStage === 'story' ? 9.5 : 11.8;

    drawReelFrame(ctx, width, height, previewTimestamp, {
      aspectRatio: reelAspectRatio,
      durationSeconds: 13.0,
      fps: 60,
      includeAudio,
      lang,
      tone,
      fontFamily: customFont,
      isJustified,
      headline,
      keyPoints,
      sourceName,
      categoryName,
      imageElement: activeImageRef.current,
      imageBrightness,
      logoElement: sondeshLogoRef.current,
      headlineSize,
      bulletSize,
    });
  }, [
    reelAspectRatio,
    videoPreviewStage,
    includeAudio,
    lang,
    tone,
    customFont,
    isJustified,
    headline,
    keyPoints,
    sourceName,
    categoryName,
    imageBrightness,
    headlineSize,
    bulletSize,
    imageLoaded,
    logoLoaded,
  ]);

  // Redraw Reel End-Result Frame whenever video customization inputs change
  useEffect(() => {
    if (studioTab === 'video' && reelMode === 'edit') {
      drawReelPreviewFrame();
    }
  }, [studioTab, reelMode, drawReelPreviewFrame]);

  // Refine with AI handler
  const handleRefineWithAI = async () => {
    setIsRefining(true);
    try {
      const isBn = lang === 'bn';
      const rawTitle = isBn
        ? story.daily_buzz?.title_bn || story.daily_buzz?.title_en || headline
        : story.daily_buzz?.title_en || story.daily_buzz?.title_bn || headline;

      const rawSummary = isBn
        ? story.daily_buzz?.summary_bn || story.daily_buzz?.summary_en || ''
        : story.daily_buzz?.summary_en || story.daily_buzz?.summary_bn || '';

      const rawBullets = isBn
        ? story.daily_buzz?.bullets_bn || story.daily_buzz?.bullets_en || []
        : story.daily_buzz?.bullets_en || story.daily_buzz?.bullets_bn || [];

      const result = await refineSocialCardWithGemini({
        title: rawTitle,
        summary: rawSummary,
        bullets: rawBullets,
        language: lang,
        tone,
        apiKey: customApiKey
      });

      setHeadline(result.hookTitle);
      setKeyPoints(result.keyPoints);
    } catch (err) {
      console.error('Error refining card with AI:', err);
    } finally {
      setIsRefining(false);
    }
  };

  // Download high-res PNG
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Could not export image. Please try uploading the image file or pasting directly with Ctrl+V.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const slug = (story.story_id || 'story').slice(0, 16);
        a.download = `sondesh-express-${designVersion}-${tone}-${slug}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err: any) {
      console.error('Canvas export error:', err);
      alert('Cross-Origin Restriction: The source website blocked direct image export. Please right-click "Copy Image" on the news article and press Ctrl+V to paste it directly, or upload the file.');
    }
  };

  // Copy minimalist social caption
  const handleCopyCaption = async () => {
    const isBn = lang === 'bn';
    const hashtags = isBn
      ? '#সন্দেশএক্সপ্রেস #SondeshExpress #বাংলাদেশ #CurrentAffairs #BangladeshNews'
      : '#SondeshExpress #Bangladesh #CurrentAffairs #DailyBrief #WorldNews';

    const caption = `${headline}\n\n🔗 sondesh.web.app\n\n${hashtags}`;
    
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error('Failed to copy caption:', err);
    }
  };

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('dorpon_gemini_api_key', customApiKey.trim());
    } else {
      localStorage.removeItem('dorpon_gemini_api_key');
    }
    setShowKeyInput(false);
  };

  // Update specific key point
  const handleUpdateKeyPoint = (index: number, val: string) => {
    const updated = [...keyPoints];
    updated[index] = val;
    setKeyPoints(updated);
  };

  // Add new key point if under 3
  const handleAddKeyPoint = () => {
    if (keyPoints.length < 3) {
      setKeyPoints([...keyPoints, '']);
    }
  };

  // Remove key point
  const handleRemoveKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, idx) => idx !== index));
  };

  // Render 10-Second Motion News Reel Video (Keep Render, Play, and Download separated)
  const handleRenderReelVideo = async () => {
    setIsExportingReel(true);
    setReelProgress(0);
    setReelCurrentSec(0);

    try {
      const result = await renderAndExportReelVideo({
        aspectRatio: reelAspectRatio,
        durationSeconds: 13.0,
        fps: 60,
        includeAudio,
        lang,
        tone,
        fontFamily: customFont,
        isJustified,
        headline,
        keyPoints,
        sourceName,
        categoryName,
        imageElement: activeImageRef.current,
        imageBrightness,
        logoElement: sondeshLogoRef.current,
        headlineSize,
        bulletSize,
        onProgress: (prog, sec) => {
          setReelProgress(prog);
          setReelCurrentSec(sec);
        },
      });

      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }

      const url = URL.createObjectURL(result.blob);
      setRenderedVideoUrl(url);
      setRenderedBlob(result.blob);
      setRenderedFilename(result.filename);
      setIsPlayingVideo(false);
      setReelMode('preview'); // Switch to video player preview and lock customization!
    } catch (err: any) {
      console.error('Reel video render failed:', err);
      alert('Reel generation failed: ' + (err.message || 'Please check browser settings.'));
    } finally {
      setIsExportingReel(false);
    }
  };

  // Switch back to edit mode, unlock customization, and show live end-result frame canvas
  const handleUnlockReelForEdit = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlayingVideo(false);
    setReelMode('edit');
  };

  // Toggle Play / Pause for the rendered video preview player
  const handleTogglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlayingVideo(true);
    } else {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    }
  };

  // Download the rendered video file
  const handleDownloadRenderedVideo = () => {
    if (!renderedVideoUrl || !renderedFilename) return;
    const a = document.createElement('a');
    a.href = renderedVideoUrl;
    a.download = renderedFilename;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#121417] border border-primary/30 w-full max-w-6xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Studio Top Bar */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#16191d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-bold text-sm shadow">
              স
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                <span>Sondesh Express • Social Studio</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-emerald-400 border border-emerald-500/30">
                  {studioTab === 'photo' ? '4:5 Photo Card (1080x1350)' : `13s Video Reel (${reelAspectRatio}) • 60 FPS`}
                </span>
              </h3>
              <p className="text-xs text-white/50 font-serif">
                {studioTab === 'photo'
                  ? 'High-impact mobile photo cards with summarized key points for Facebook & Instagram'
                  : '13-Second ultra-smooth 60 FPS kinetic motion news reels with Ken Burns zoom, brand stinger & ambient audio'}
              </p>
            </div>
          </div>

          {/* STUDIO MODE TABS (PHOTO VS VIDEO SEPARATION) */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/15">
            <button
              type="button"
              onClick={() => setStudioTab('photo')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                studioTab === 'photo'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo Card</span>
              <span className="text-[10px] opacity-75 font-mono">4:5</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab('video')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                studioTab === 'video'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>13s Video Reel (60 FPS)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-400/20 text-emerald-300 font-mono font-bold">
                60 FPS
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-2.5 py-1 text-xs border border-white/20 text-white/70 hover:text-white rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">AI Settings</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer if opened */}
        {showKeyInput && (
          <div className="p-3 bg-[#1e2227] border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-bold text-amber-400 shrink-0">Gemini Key:</span>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Paste your Google Gemini API Key here (optional)..."
                className="bg-black/50 border border-white/20 rounded px-2.5 py-1 text-white text-xs w-full max-w-md focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded cursor-pointer"
              >
                Save
              </button>
            </div>
            <span className="text-[11px] text-white/50">Stored securely in your local browser storage</span>
          </div>
        )}

        {/* Main Content Workspace (Preview + Controls) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
          {/* LEFT: Live Preview Workspace (Photo Card Canvas vs Video Player) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-black/40 p-4 rounded-lg border border-white/10">
            {studioTab === 'photo' ? (
              <>
                <div className="relative shadow-2xl rounded overflow-hidden max-h-[580px] w-auto aspect-[4/5] border border-white/20">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                    style={{ aspectRatio: '4/5' }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] text-white/50">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${designVersion === 'v2' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                    Active: <b className="text-white font-mono">{designVersion === 'v2' ? 'Next-Gen (v2)' : 'Classic (v1)'}</b>
                  </span>
                  <span className="text-emerald-400 font-mono">1080 x 1350 px (4:5)</span>
                </div>
              </>
            ) : (
              <>
                {/* 10-Second Video Reel Preview: Live End-Result Frame vs Rendered Video Player */}
                {reelMode === 'edit' ? (
                  /* Customizing: LIVE FRAME CANVAS (Toggle Story 7.5s vs Logo Outro 9.5s) */
                  <div className="w-full flex flex-col items-center">
                    <div className="mb-2.5 flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setVideoPreviewStage('story')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          videoPreviewStage === 'story'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-white/60 hover:text-white'
                        }`}
                        title="Preview the news story frame (headline, photo & key points)"
                      >
                        <span>📰</span>
                        <span>News Story Frame</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoPreviewStage('outro')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          videoPreviewStage === 'outro'
                            ? 'bg-[#CAFE03] text-[#132B30] font-bold shadow-sm'
                            : 'text-white/60 hover:text-white'
                        }`}
                        title="Preview the Sondesh Brand Logo outro with Follow Us button & website CTA"
                      >
                        <span>🎬</span>
                        <span>Brand Outro Frame</span>
                      </button>
                    </div>

                    <div
                      className="relative shadow-2xl rounded overflow-hidden max-h-[560px] w-auto border border-white/20 bg-black flex items-center justify-center"
                      style={{ aspectRatio: reelAspectRatio === '9:16' ? '9/16' : '4/5' }}
                    >
                      <canvas
                        ref={reelCanvasRef}
                        className="w-full h-full object-contain"
                        style={{ aspectRatio: reelAspectRatio === '9:16' ? '9/16' : '4/5' }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Rendered: INTERACTIVE VIDEO PLAYER */
                  <div
                    className="relative shadow-2xl rounded overflow-hidden max-h-[580px] w-auto border border-white/20 bg-black flex items-center justify-center"
                    style={{ aspectRatio: reelAspectRatio === '9:16' ? '9/16' : '4/5' }}
                  >
                    <video
                      ref={videoRef}
                      src={renderedVideoUrl || ''}
                      controls
                      loop
                      playsInline
                      onPlay={() => setIsPlayingVideo(true)}
                      onPause={() => setIsPlayingVideo(false)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] text-white/50">
                  <span className="flex items-center gap-1.5">
                    {reelMode === 'edit' ? (
                      <>
                        <span className={`w-2 h-2 rounded-full ${videoPreviewStage === 'story' ? 'bg-emerald-400' : 'bg-[#CAFE03]'}`}></span>
                        <span className="text-white/80">
                          Viewing:{' '}
                          <b className={`font-mono ${videoPreviewStage === 'story' ? 'text-emerald-400' : 'text-[#CAFE03]'}`}>
                            {videoPreviewStage === 'story' ? 'News Story Card' : 'Brand Logo Outro'}
                          </b>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-white/80">
                          Preview: <b className="text-emerald-400 font-mono">Video Player (60 FPS)</b>
                        </span>
                      </>
                    )}
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {reelAspectRatio === '9:16' ? '1080 x 1920 (9:16) • 60 FPS' : '1080 x 1350 (4:5) • 60 FPS'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Controls & Copywriting Studio (Photo Card vs Video Reel) */}
          <div className="lg:col-span-7 flex flex-col space-y-3.5">
            {studioTab === 'photo' ? (
              <>
                {/* DESIGN VERSION TOGGLE BUTTON (Requested Comparison Switcher) */}
            <div className="p-2.5 bg-gradient-to-r from-emerald-950/40 via-[#181b1f] to-blue-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Card Design Version:</span>
                </span>
                <span className="text-[10px] text-white/50 block">
                  Compare new segmented cards & emblem vs classic layout
                </span>
              </div>
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setDesignVersion('v2')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    designVersion === 'v2'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-200" />
                  <span>Next-Gen (v2)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesignVersion('v1')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    designVersion === 'v1'
                      ? 'bg-white/20 text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>Classic (v1)</span>
                </button>
              </div>
            </div>

            {/* Tone Accent & Language Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tone Accent Toggle */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/70 mb-1.5">
                  Card Accent Color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTone('positive')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tone === 'positive'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Emerald Accent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('critical')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tone === 'critical'
                        ? 'bg-red-950/70 border-red-500 text-red-300 shadow-sm ring-1 ring-red-500/50'
                        : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Crimson Accent</span>
                  </button>
                </div>
              </div>

              {/* Language Toggle */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/70 mb-1.5">
                  Card Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLang('bn')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      lang === 'bn'
                        ? 'bg-primary/20 border-white text-white shadow-sm'
                        : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bangla">বাংলা (Bangla)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      lang === 'en'
                        ? 'bg-primary/20 border-white text-white shadow-sm'
                        : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>English</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Brightness Controls */}
            {designVersion === 'v2' && (
              <div className="p-3 bg-[#181b1f] border border-white/10 rounded-lg space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-1">
                    <span className="flex items-center gap-1 font-bold">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>Photo Brightness</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{imageBrightness}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageBrightness(prev => Math.max(80, prev - 5))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="80"
                      max="140"
                      step="5"
                      value={imageBrightness}
                      onChange={(e) => setImageBrightness(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setImageBrightness(prev => Math.min(140, prev + 5))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Typography Sizing & Quick Resize Presets */}
            <div className="p-3 bg-[#181b1f] border border-white/10 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-white/70 block">
                  Resize Texts
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setHeadlineSize(52); setBulletSize(28); }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-white/5 hover:bg-white/15 text-white/80 border border-white/15 cursor-pointer transition-colors"
                  >
                    A- Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeadlineSize(62); setBulletSize(34); }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-white/5 hover:bg-white/15 text-white/80 border border-white/15 cursor-pointer transition-colors"
                  >
                    A Balanced
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeadlineSize(70); setBulletSize(38); }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-white/5 hover:bg-white/15 text-white/80 border border-white/15 cursor-pointer transition-colors"
                  >
                    A+ Prominent
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Headline Resize Slider & Buttons */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Headline Size</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setHeadlineSize(prev => Math.max(42, prev - 2))}
                        className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                        title="Decrease headline font"
                      >
                        -
                      </button>
                      <span className="font-mono text-emerald-400 font-bold px-1 min-w-[36px] text-center">
                        {headlineSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => setHeadlineSize(prev => Math.min(76, prev + 2))}
                        className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                        title="Increase headline font"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="42"
                    max="76"
                    value={headlineSize}
                    onChange={(e) => setHeadlineSize(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Key Points Resize Slider & Buttons */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Key Points Size</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBulletSize(prev => Math.max(22, prev - 2))}
                        className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                        title="Decrease key points font"
                      >
                        -
                      </button>
                      <span className="font-mono text-emerald-400 font-bold px-1 min-w-[36px] text-center">
                        {bulletSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => setBulletSize(prev => Math.min(44, prev + 2))}
                        className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                        title="Increase key points font"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="22"
                    max="44"
                    value={bulletSize}
                    onChange={(e) => setBulletSize(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Font Family & Text Justification Bar */}
              <div className="pt-2.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Font Selector */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-1 flex items-center gap-1">
                    <Type className="w-3 h-3 text-emerald-400" />
                    <span>Custom Font Family</span>
                  </label>
                  <select
                    value={customFont}
                    onChange={(e) => setCustomFont(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-sans cursor-pointer"
                  >
                    {lang === 'bn' ? (
                      <>
                        <option value="Hind Siliguri">Hind Siliguri (Modern Clean Sans)</option>
                        <option value="Anek Bangla">Anek Bangla (Bold Viral Display)</option>
                        <option value="Noto Serif Bengali">Noto Serif Bengali (Prestigious Serif)</option>
                      </>
                    ) : (
                      <>
                        <option value="Lora">Lora (Journalistic Serif)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans (Geometric Modern)</option>
                        <option value="Playfair Display">Playfair Display (Luxury Editorial Serif)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech Display)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Justified vs Left Alignment */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-1 flex items-center gap-1">
                    <AlignJustify className="w-3 h-3 text-emerald-400" />
                    <span>Paragraph Alignment</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsJustified(true)}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isJustified
                          ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <AlignJustify className="w-3 h-3" />
                      <span>Justified</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsJustified(false)}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        !isJustified
                          ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span>Left</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Refine Button */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/30 to-blue-950/30 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Viral Hook & Key Points
                </span>
                <span className="text-white/60 text-[11px]">
                  Generates an 8-12 word hook and 2-3 summarized key points
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefineWithAI}
                disabled={isRefining}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow active:scale-95"
              >
                {isRefining ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Refine with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Text Inputs */}
            <div className="space-y-3">
              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1 flex items-center justify-between">
                  <span>Photo Card Headline (Hook)</span>
                  <span className="text-[10px] text-white/40">{headline.length} chars</span>
                </label>
                <textarea
                  rows={2}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-serif leading-snug"
                  placeholder="Enter punchy headline for the photo card..."
                />
              </div>

              {/* Summarized Key Points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Summarized Key Points (2-3 Points)</span>
                  </label>
                  {keyPoints.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddKeyPoint}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                    >
                      + Add Point
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {keyPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-emerald-400 text-xs font-mono font-bold shrink-0">
                        {designVersion === 'v2' ? `Point 0${idx + 1}:` : `◆ Point ${idx + 1}:`}
                      </span>
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => handleUpdateKeyPoint(idx, e.target.value)}
                        className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-serif"
                        placeholder={`Key point ${idx + 1}...`}
                      />
                      {keyPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyPoint(idx)}
                          className="p-1.5 text-white/40 hover:text-red-400 cursor-pointer"
                          title="Remove point"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Source & Image Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Source Attribution
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. প্রথম আলো, The Daily Star"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-white/80">
                      Custom Photo / Image URL
                    </label>
                    <span className="text-[10px] text-white/40 italic">Supports Paste (Ctrl+V)</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400 truncate"
                      placeholder="Paste image URL (Prothom Alo, Somoy, etc.)..."
                    />
                    {/* Paste from Clipboard Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const clipItems = await navigator.clipboard.read();
                          for (const item of clipItems) {
                            for (const type of item.types) {
                              if (type.startsWith('image/')) {
                                const blob = await item.getType(type);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setImageUrl(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(blob);
                                return;
                              }
                            }
                          }
                          const text = await navigator.clipboard.readText();
                          if (text) setImageUrl(text.trim());
                        } catch {
                          const text = prompt('Paste image URL:');
                          if (text) setImageUrl(text.trim());
                        }
                      }}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center cursor-pointer border border-white/20"
                      title="Paste image directly from clipboard (Ctrl+V)"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                    </button>
                    {/* Upload Local Image Button */}
                    <label className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center cursor-pointer border border-white/20" title="Upload local image file">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="hidden" />
                    </label>
                  </div>

                  {/* CORS Status & Feedback */}
                  {isImageLoading && (
                    <span className="text-[10px] text-amber-300 flex items-center gap-1 mt-1 font-mono">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying image CORS headers & proxy...
                    </span>
                  )}
                  {!isImageLoading && imageCorsStatus === 'proxied' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <Check className="w-3 h-3" /> CORS bypassed via secure proxy (Ready for HD export)
                    </span>
                  )}
                  {!isImageLoading && imageCorsStatus === 'preview_only' && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Preview mode (origin blocked CORS). Tip: Copy image & press Ctrl+V to enable export!</span>
                    </span>
                  )}
                  {!isImageLoading && imageCorsStatus === 'clean' && imageUrl && (
                    <span className="text-[10px] text-white/50 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Image loaded cleanly. Press Ctrl+V anytime to paste.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PHOTO CARD ACTION BUTTONS (Download & Copy Caption) */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyCaption}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-[#181b1f] hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Caption Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Social Caption</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download 4:5 PNG ({designVersion.toUpperCase()})</span>
              </button>
            </div>
          </>
        ) : (
          /* ==================================================== */
          /* 10-SECOND MOTION NEWS REEL VIDEO STATION (DEDICATED) */
          /* ==================================================== */
          <div className="space-y-3.5">
            {/* Mode & Lock Status Header */}
            {reelMode === 'preview' ? (
              <div className="p-3 bg-gradient-to-r from-amber-950/40 via-[#181b1f] to-amber-950/20 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Customization Locked (Video Rendered)</span>
                    <span className="text-[10px] text-white/50">Click "Edit Video" below to unlock and adjust fonts or photos</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockReelForEdit}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Unlock to Edit</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-[#181b1f] to-teal-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Video Customization Mode (60 FPS)</span>
                    <span className="text-[10px] text-white/50">Left pane shows live frame (toggle between Story 10s and Outro 12s)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  EDITABLE
                </span>
              </div>
            )}

            {/* CUSTOMIZATION CONTAINER (Disabled/Dimmed when customization is locked) */}
            <div className={`space-y-3.5 transition-opacity ${reelMode === 'preview' ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              {/* 1. Video Format (Aspect Ratio) & Ambient Audio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Format selection */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/70 mb-1.5">
                    Video Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => setReelAspectRatio('9:16')}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        reelAspectRatio === '9:16'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                          : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-emerald-400" />
                        <span>9:16 Vertical</span>
                      </span>
                      <span className="text-[9px] opacity-60 font-mono">Reels/Shorts (1080x1920)</span>
                    </button>

                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => setReelAspectRatio('4:5')}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        reelAspectRatio === '4:5'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                          : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-emerald-400" />
                        <span>4:5 Feed</span>
                      </span>
                      <span className="text-[9px] opacity-60 font-mono">Feed Video (1080x1350)</span>
                    </button>
                  </div>
                </div>

                {/* Audio Setting */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/70 mb-1.5">
                    Background Audio Tone
                  </label>
                  <button
                    type="button"
                    disabled={reelMode === 'preview'}
                    onClick={() => setIncludeAudio(!includeAudio)}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer h-[52px] ${
                      includeAudio
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {includeAudio ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white/40" />}
                      <div className="text-left">
                        <div className="font-bold text-xs text-white">Sleek Ambient Tone</div>
                        <div className="text-[10px] text-white/50">Synthesized 65Hz Harmonic Drone</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/50 border border-white/10">
                      {includeAudio ? 'ENABLED' : 'MUTED'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Language & Accent Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accent Color */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/70 mb-1.5">
                    Video Accent Color
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => setTone('positive')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tone === 'positive'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                          : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Emerald</span>
                    </button>
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => setTone('critical')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tone === 'critical'
                          ? 'bg-red-950/70 border-red-500 text-red-300 shadow-sm ring-1 ring-red-500/50'
                          : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>Crimson</span>
                    </button>
                  </div>
                </div>

                {/* Language Toggle */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/70 mb-1.5">
                    Video Language
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => setLang('bn')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        lang === 'bn'
                          ? 'bg-primary/20 border-white text-white shadow-sm'
                          : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span>বাংলা (BN)</span>
                    </button>
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => setLang('en')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        lang === 'en'
                          ? 'bg-primary/20 border-white text-white shadow-sm'
                          : 'bg-[#181b1f] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>English (EN)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Typography Customization (Headline & Key Points Font Size Controls) */}
              <div className="p-3 bg-[#181b1f] border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Typography & Font Sizes (Video)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => { setHeadlineSize(52); setBulletSize(30); }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                      title="Compact Presets"
                    >
                      A- Compact
                    </button>
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => { setHeadlineSize(62); setBulletSize(34); }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 text-emerald-400 border border-emerald-500/30"
                      title="Default Balanced"
                    >
                      A Balanced
                    </button>
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={() => { setHeadlineSize(70); setBulletSize(38); }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                      title="Prominent Presets"
                    >
                      A+ Prominent
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Headline Size Slider & Step Buttons */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-white/80 font-medium">Headline Size</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={reelMode === 'preview'}
                          onClick={() => setHeadlineSize(Math.max(44, headlineSize - 2))}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-emerald-400 text-xs font-bold w-9 text-center">{headlineSize}px</span>
                        <button
                          type="button"
                          disabled={reelMode === 'preview'}
                          onClick={() => setHeadlineSize(Math.min(76, headlineSize + 2))}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={44}
                      max={76}
                      step={2}
                      value={headlineSize}
                      disabled={reelMode === 'preview'}
                      onChange={(e) => setHeadlineSize(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Bullet Size Slider & Step Buttons */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-white/80 font-medium">Key Points Size</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={reelMode === 'preview'}
                          onClick={() => setBulletSize(Math.max(24, bulletSize - 2))}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono text-emerald-400 text-xs font-bold w-9 text-center">{bulletSize}px</span>
                        <button
                          type="button"
                          disabled={reelMode === 'preview'}
                          onClick={() => setBulletSize(Math.min(44, bulletSize + 2))}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={44}
                      step={2}
                      value={bulletSize}
                      disabled={reelMode === 'preview'}
                      onChange={(e) => setBulletSize(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Custom Font Family & Alignment (Video Reel) */}
                <div className="pt-2.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Font Selector */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3 text-emerald-400" />
                      <span>Custom Font Family</span>
                    </label>
                    <select
                      value={customFont}
                      disabled={reelMode === 'preview'}
                      onChange={(e) => setCustomFont(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-sans cursor-pointer"
                    >
                      {lang === 'bn' ? (
                        <>
                          <option value="Hind Siliguri">Hind Siliguri (Modern Clean Sans)</option>
                          <option value="Anek Bangla">Anek Bangla (Bold Viral Display)</option>
                          <option value="Noto Serif Bengali">Noto Serif Bengali (Prestigious Serif)</option>
                        </>
                      ) : (
                        <>
                          <option value="Lora">Lora (Journalistic Serif)</option>
                          <option value="Plus Jakarta Sans">Plus Jakarta Sans (Geometric Modern)</option>
                          <option value="Playfair Display">Playfair Display (Luxury Editorial Serif)</option>
                          <option value="Space Grotesk">Space Grotesk (Tech Display)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Justified vs Left Alignment */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-1 flex items-center gap-1">
                      <AlignJustify className="w-3 h-3 text-emerald-400" />
                      <span>Paragraph Alignment</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={reelMode === 'preview'}
                        onClick={() => setIsJustified(true)}
                        className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isJustified
                            ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                            : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <AlignJustify className="w-3 h-3" />
                        <span>Justified</span>
                      </button>
                      <button
                        type="button"
                        disabled={reelMode === 'preview'}
                        onClick={() => setIsJustified(false)}
                        className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          !isJustified
                            ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                            : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-3 h-3" />
                        <span>Left</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Photo Tuning, Image URL & Local Upload */}
              <div className="p-2.5 bg-[#181b1f] border border-white/10 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-white/80 font-medium flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Photo Brightness</span>
                  </span>
                  <span className="font-mono text-amber-400 text-xs font-bold">{imageBrightness}%</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={150}
                  step={5}
                  value={imageBrightness}
                  disabled={reelMode === 'preview'}
                  onChange={(e) => setImageBrightness(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
              </div>

              {/* Photo Input (URL + Local Image Upload) & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-white/80">
                      Custom Photo / Image URL
                    </label>
                    <span className="text-[10px] text-white/40 italic">Supports Paste (Ctrl+V)</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      disabled={reelMode === 'preview'}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400 truncate"
                      placeholder="Paste image URL (Prothom Alo, Somoy, etc.)..."
                    />
                    {/* Paste from Clipboard Button */}
                    <button
                      type="button"
                      disabled={reelMode === 'preview'}
                      onClick={async () => {
                        try {
                          const clipItems = await navigator.clipboard.read();
                          for (const item of clipItems) {
                            for (const type of item.types) {
                              if (type.startsWith('image/')) {
                                const blob = await item.getType(type);
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setImageUrl(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(blob);
                                return;
                              }
                            }
                          }
                          const text = await navigator.clipboard.readText();
                          if (text) setImageUrl(text.trim());
                        } catch {
                          const text = prompt('Paste image URL:');
                          if (text) setImageUrl(text.trim());
                        }
                      }}
                      className={`px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center cursor-pointer border border-white/20 ${reelMode === 'preview' ? 'opacity-50 pointer-events-none' : ''}`}
                      title="Paste image directly from clipboard (Ctrl+V)"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                    </button>
                    {/* Upload Local Image Button */}
                    <label className={`px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center cursor-pointer border border-white/20 ${reelMode === 'preview' ? 'opacity-50 pointer-events-none' : ''}`} title="Upload local image">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="hidden" />
                    </label>
                  </div>

                  {/* CORS Status & Feedback */}
                  {isImageLoading && (
                    <span className="text-[10px] text-amber-300 flex items-center gap-1 mt-1 font-mono">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying image CORS headers & proxy...
                    </span>
                  )}
                  {!isImageLoading && imageCorsStatus === 'proxied' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <Check className="w-3 h-3" /> CORS bypassed via secure proxy (Ready for HD export)
                    </span>
                  )}
                  {!isImageLoading && imageCorsStatus === 'preview_only' && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Preview mode (origin blocked CORS). Tip: Copy image & press Ctrl+V to enable export!</span>
                    </span>
                  )}
                  {!isImageLoading && imageCorsStatus === 'clean' && imageUrl && (
                    <span className="text-[10px] text-white/50 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Image loaded cleanly. Press Ctrl+V anytime to paste.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1">
                    Source Attribution
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    disabled={reelMode === 'preview'}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. প্রথম আলো, The Daily Star"
                  />
                </div>
              </div>

              {/* 5. Story Copywriting (Headline & Bullets) */}
              <div className="space-y-3">
                {/* Headline input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-white/80">
                      Reel Hook Headline
                    </label>
                    <button
                      type="button"
                      disabled={isRefining || reelMode === 'preview'}
                      onClick={handleRefineWithAI}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isRefining ? 'Refining...' : 'Refine with AI'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={headline}
                    disabled={reelMode === 'preview'}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-serif leading-snug"
                    placeholder="Enter punchy hook headline for the reel..."
                  />
                </div>

                {/* Summarized Key Points */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                      <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sequenced Key Points (2-3 Points)</span>
                    </label>
                    {keyPoints.length < 3 && reelMode !== 'preview' && (
                      <button
                        type="button"
                        onClick={handleAddKeyPoint}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                      >
                        + Add Point
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {keyPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-400 text-xs font-mono font-bold shrink-0">
                          {`Point 0${idx + 1}:`}
                        </span>
                        <input
                          type="text"
                          value={pt}
                          disabled={reelMode === 'preview'}
                          onChange={(e) => handleUpdateKeyPoint(idx, e.target.value)}
                          className="w-full bg-[#181b1f] border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-serif"
                          placeholder={`Key point ${idx + 1}...`}
                        />
                        {keyPoints.length > 1 && reelMode !== 'preview' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyPoint(idx)}
                            className="p-1.5 text-white/40 hover:text-red-400 cursor-pointer"
                            title="Remove point"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION HUB (RENDER BUTTON vs EDIT & PLAYER CONTROLS) */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              {reelMode === 'edit' ? (
                /* IN EDIT MODE: THE RENDER BUTTON */
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleRenderReelVideo}
                    disabled={isExportingReel}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isExportingReel ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Rendering 13s Video Reel (60 FPS)... ({reelProgress.toFixed(0)}%)</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-4 h-4" />
                        <span>Render 13s Video Reel ({reelAspectRatio} • 60 FPS)</span>
                      </>
                    )}
                  </button>

                  {renderedVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setReelMode('preview')}
                      className="w-full py-1.5 text-center text-xs text-white/60 hover:text-white font-medium cursor-pointer"
                    >
                      Return to already rendered video preview →
                    </button>
                  )}
                </div>
              ) : (
                /* IN PREVIEW MODE: THE RENDER BUTTON TURNS INTO EDIT BUTTON, WITH PLAY & DOWNLOAD */
                <div className="space-y-2.5">
                  {/* The Render Button has turned into the EDIT BUTTON keeping customization locked */}
                  <button
                    type="button"
                    onClick={handleUnlockReelForEdit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#22272e] hover:bg-[#2b313a] text-amber-300 border border-amber-500/40 text-xs font-bold shadow transition-all cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Edit Video (Unlock Customization)</span>
                  </button>

                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Video Ready (60 FPS Ultra-Smooth)</span>
                      </span>
                      <span className="text-[10px] text-white/50 font-mono">
                        {(renderedBlob ? (renderedBlob.size / 1024 / 1024).toFixed(1) : '8.5')} MB • 13.0s (60 FPS)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Play / Pause Toggle Button */}
                      <button
                        type="button"
                        onClick={handleTogglePlayVideo}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        {isPlayingVideo ? (
                          <>
                            <Pause className="w-4 h-4 text-amber-400" />
                            <span>Pause Video</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 text-emerald-400" />
                            <span>Play Video</span>
                          </>
                        )}
                      </button>

                      {/* Download Video Button */}
                      <button
                        type="button"
                        onClick={handleDownloadRenderedVideo}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Video</span>
                      </button>
                    </div>

                    {/* Copy Social Caption for Reel */}
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/15 bg-black/40 hover:bg-white/5 text-white/80 text-xs font-medium transition-all cursor-pointer"
                    >
                      {copiedCaption ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Reel Caption Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Reel Social Caption & Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

        {/* Reel Rendering Progress Modal Overlay */}
        {isExportingReel && (
          <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#14171a] border border-emerald-500/40 w-full max-w-md rounded-2xl p-6 text-center shadow-2xl space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 animate-pulse">
                <Film className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Rendering 13s Motion Reel (60 FPS)</h4>
                <p className="text-xs text-white/60 mt-1">
                  Synthesizing 60 FPS smooth motion, Ken Burns zoom, sequenced text reveal & ambient audio tone...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${reelProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-white/70">
                <span>{reelProgress.toFixed(0)}% Complete</span>
                <span>{reelCurrentSec.toFixed(1)}s / 13.0s (60 FPS)</span>
              </div>

              <p className="text-[11px] text-white/40 italic">
                Please keep this tab open while browser encodes the video file.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
