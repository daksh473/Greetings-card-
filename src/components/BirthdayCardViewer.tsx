import React, { useState, useEffect, useRef } from "react";
import { BirthdayCardState } from "../types";
import { synth } from "../utils/audio";
import { AVATAR_OPTIONS } from "../utils/sharing";
import { Gift, Volume2, VolumeX, Sparkles, RefreshCw, Flame, Check, HelpCircle, Heart, Star, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

interface BirthdayCardViewerProps {
  state: BirthdayCardState;
  isInteractivePreview?: boolean;
  onResetPreview?: () => void;
}

interface FloatingBalloon {
  id: number;
  x: number; // percentage from left
  size: number;
  color: string;
  popped: boolean;
  quote: string;
  delay: number;
}

export default function BirthdayCardViewer({ state, isInteractivePreview = false, onResetPreview }: BirthdayCardViewerProps) {
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [giftDiscovered, setGiftDiscovered] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [balloons, setBalloons] = useState<FloatingBalloon[]>([]);
  const [activeQuoteToast, setActiveQuoteToast] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [pinterestPage, setPinterestPage] = useState(1);
  const [dearYouStep, setDearYouStep] = useState(1);

  // States and refs for passcode gate
  const [passcodeVerified, setPasscodeVerified] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  // States and refs for dynamic multimedia Kawaii card features
  const [albumIndex, setAlbumIndex] = useState(0);
  const [activeWish, setActiveWish] = useState<string | null>(null);
  const [isSpinningWish, setIsSpinningWish] = useState(false);
  
  const uploadedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.7);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sound generator parameters
  const theme = state.theme;
  const emotion = state.emotion || "funny";

  // Render Theme Styles
  // Returns styling classes for the chosen theme: [Background, Card, Font display, Text body, Buttons, Accent badge]
  const getThemeClasses = () => {
    switch (theme) {
      case "midnight":
        return {
          bg: "bg-gradient-to-br from-[#0a0d24] via-[#11163b] to-[#060817] text-amber-100 font-sans min-h-screen relative overflow-hidden",
          card: "bg-opacity-40 bg-[#161a40] border border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.15)] rounded-2xl text-amber-100",
          heading: "font-serif text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300",
          body: "text-amber-100/90 leading-relaxed font-light",
          button: "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-900 border border-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]",
          secondaryButton: "bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/50",
          accent: "text-amber-400",
          glow: "shadow-[0_0_15px_#f59e0b]",
        };
      case "pastel":
        return {
          bg: "bg-gradient-to-br from-[#ffe4e6] via-[#fdf2f8] to-[#e0f2fe] text-rose-900 font-sans min-h-screen relative overflow-hidden",
          card: "bg-white/80 border border-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.08)] rounded-2xl text-rose-900 backdrop-blur-md",
          heading: "font-sans text-3xl md:text-5xl font-black tracking-tight text-rose-500",
          body: "text-rose-800/90 leading-relaxed",
          button: "bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-200",
          secondaryButton: "bg-pink-50 hover:bg-pink-100 text-rose-600 border border-rose-100",
          accent: "text-rose-500",
          glow: "shadow-[0_0_15px_#f43f5e]",
        };
      case "kawaii":
        return {
          bg: "bg-gradient-to-br from-[#fef08a] via-[#ffedd5] to-[#f472b6] text-amber-950 min-h-screen relative overflow-hidden",
          card: "bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-2xl text-slate-900",
          heading: "font-sans font-black text-3xl md:text-5xl tracking-normal text-slate-900 stroke-text",
          body: "text-slate-900 font-medium leading-relaxed",
          button: "bg-[#f472b6] hover:bg-[#ec4899] text-white font-extrabold border-4 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all",
          secondaryButton: "bg-yellow-105 hover:bg-yellow-200 text-slate-900 font-extrabold border-4 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]",
          accent: "text-[#db2777]",
          glow: "border-4 border-slate-900 shadow-[0_0_0_4px_#f472b6]",
        };
      case "disco":
        return {
          bg: "bg-gradient-to-br from-[#090514] via-[#1a0b36] to-[#040108] text-indigo-100 font-mono min-h-screen relative overflow-hidden",
          card: "bg-[#110729]/80 border-2 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] rounded-2xl text-fuchsia-100",
          heading: "font-sans font-black text-3xl md:text-5xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300 animate-pulse",
          body: "text-cyan-100/90 leading-relaxed font-mono text-sm",
          button: "bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-black font-black uppercase tracking-widest",
          secondaryButton: "bg-slate-950 hover:bg-slate-900 text-cyan-400 border border-cyan-500/50",
          accent: "text-fuchsia-400",
          glow: "shadow-[0_0_15px_#d946ef]",
        };
      case "space":
        return {
          bg: "bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] text-indigo-100 font-sans min-h-screen relative overflow-hidden",
          card: "bg-slate-900/80 border border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.2)] rounded-2xl text-indigo-100",
          heading: "font-sans text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400",
          body: "text-indigo-200/90 leading-relaxed font-slate-300",
          button: "bg-indigo-600 hover:bg-indigo-500 text-white font-bold border border-indigo-400/50 shadow-lg shadow-indigo-500/30",
          secondaryButton: "bg-slate-950/80 hover:bg-slate-900 text-indigo-300 border border-indigo-500/30",
          accent: "text-indigo-400",
          glow: "shadow-[0_0_15px_#6366f1]",
        };
    }
  };

  // Returns styling classes and dynamic configurations for the chosen card Emotion/Mood page
  const getEmotionClasses = () => {
    switch (emotion) {
      case "emotional":
        return {
          bg: "bg-gradient-to-br from-[#1e0a12] via-[#2f101a] to-[#100307] text-rose-100 font-sans min-h-screen relative overflow-hidden",
          card: "bg-rose-950/20 border border-rose-500/35 shadow-[0_10px_35px_rgba(244,63,94,0.1)] rounded-3xl text-rose-100 backdrop-blur-md",
          heading: "font-serif text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-350 via-pink-205 to-amber-200",
          body: "text-rose-100/90 font-light leading-loose tracking-wide",
          button: "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold tracking-wider rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.25)]",
          secondaryButton: "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40",
          accent: "text-rose-400",
          glow: "shadow-[0_0_20px_#f43f5e]",
        };
      case "poetic":
        return {
          bg: "bg-gradient-to-br from-[#0c0d16] via-[#121626] to-[#04050a] text-amber-50/90 font-serif min-h-screen relative overflow-hidden",
          card: "bg-slate-900/50 border border-amber-500/25 shadow-[0_0_30px_rgba(245,158,11,0.06)] rounded-3xl text-amber-100/90 backdrop-blur-sm",
          heading: "font-serif text-3xl md:text-5xl tracking-normal italic font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-101 to-amber-300",
          body: "text-amber-50/80 font-serif leading-loose tracking-wide italic",
          button: "bg-amber-700 hover:bg-amber-600 text-stone-900 font-bold border border-amber-500 shadow-md",
          secondaryButton: "bg-stone-950/85 hover:bg-stone-900 text-amber-200 border border-amber-500/30",
          accent: "text-amber-400",
          glow: "shadow-[0_0_20px_#f59e0b]",
        };
      case "cute":
        return {
          bg: "bg-gradient-to-br from-[#fff1f2] via-[#faf5ff] to-[#f0fdf4] text-[#4c0519] font-sans min-h-screen relative overflow-hidden",
          card: "bg-white/95 border-4 border-[#4c0519] shadow-[6px_6px_0px_#4c0519] rounded-3xl text-pink-950",
          heading: "font-sans text-3xl md:text-5xl font-black tracking-normal text-[#ec4899] drop-shadow-sm",
          body: "text-[#4c0519]/90 font-medium leading-relaxed",
          button: "bg-[#ec4899] hover:bg-[#db2777] text-white font-extrabold border-4 border-[#4c0519] shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all",
          secondaryButton: "bg-rose-50 hover:bg-rose-100 text-[#db2777] font-bold border-2 border-[#4c0519]/25",
          accent: "text-[#ec4899]",
          glow: "border-4 border-[#db2777]",
        };
      case "celebratory":
        return {
          bg: "bg-gradient-to-br from-[#020410] via-[#060e26] to-[#010207] text-yellow-100 font-sans min-h-screen relative overflow-hidden",
          card: "bg-[#0a112c]/90 border-2 border-yellow-500/60 shadow-[0_0_25px_rgba(234,179,8,0.25)] rounded-3xl text-amber-100",
          heading: "font-sans font-black text-3xl md:text-5xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500 animate-pulse",
          body: "text-yellow-100/90 leading-relaxed font-semibold tracking-wide",
          button: "bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-900 border border-yellow-300 font-black tracking-widest uppercase",
          secondaryButton: "bg-slate-950 hover:bg-slate-900 text-yellow-300 border border-yellow-500/40",
          accent: "text-yellow-450",
          glow: "shadow-[0_0_15px_#eab308]",
        };
      case "funny":
      default:
        return getThemeClasses() || getThemeClasses();
    }
  };

  // Helper to format MP3 playback seconds into 0:00 style strings
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Sync state metadata & durations for custom uploaded track
  useEffect(() => {
    if (!state.uploadedMusic) return;
    const audio = uploadedAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setAudioPlaying(false);
      setAudioCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [state.uploadedMusic]);

  // Dynamic Polaroid album parser connecting memories & favourite things input
  const getPolaroidMemories = () => {
    const defaultData = [
      {
        photo: "",
        emoji: "🧁",
        title: "sweet laughter",
        caption: state.pinterestMemory1 || "the bright smiles we share whenever we meet up ♡",
        quote: "the little cafe chats and random plans are my favorites."
      },
      {
        photo: "",
        emoji: "🌌",
        title: "endless cosmic chats",
        caption: state.pinterestMemory2 || "sipping cozy lattes and losing track of time talking about everything...",
        quote: "time flies when we speak about our dreams."
      },
      {
        photo: "",
        emoji: "🧸",
        title: "warm cozy moments",
        caption: state.pinterestMemory3 || "just really, truly thankful that i get to spend another year by your side",
        quote: "forever grateful that you are matching my energy."
      }
    ];

    if (state.uploadedPhotos && state.uploadedPhotos.length > 0) {
      const memoriesList = (state.pinterestMemories || "sharing smiles, coffee walks, late night jokes").split(",").map(s => s.trim());
      const favouritesList = (state.pinterestFavouriteThings || "matcha, hoodies, cozy games").split(",").map(s => s.trim());
      
      const templates = [
        { title: "favorite chapter", quote: "a tiny snippet of my absolute favorite memory with you." },
        { title: "cozy vibes", quote: "matching coffee latte and sweet fluffy energies." },
        { title: "another polaroid", quote: "captured forever inside our digital happy journal." },
        { title: "silly inside jokes", quote: "laughing till we can't compile anymore..." },
        { title: "with you, always", quote: "wishing this warm light never fades away." },
      ];

      return state.uploadedPhotos.map((photo, idx) => {
        const memText = memoriesList[idx % memoriesList.length] || "the quiet times we share together";
        const favText = favouritesList[idx % favouritesList.length] || "sweet surprises and cute doodles";
        const templ = templates[idx % templates.length];
        
        return {
          photo,
          emoji: "",
          title: `${templ.title} ♡`,
          caption: `${memText} — together with some ${favText}.`,
          quote: templ.quote
        };
      });
    }

    return defaultData;
  };

  const themeStyle = getEmotionClasses();

  // Pick Custom Avatar emoji or render uploaded avatar URL
  const renderAvatar = () => {
    const defaultAvatar = AVATAR_OPTIONS.find((a) => a.id === state.avatarUrl);
    if (defaultAvatar) {
      return (
        <div className={`w-28 h-28 ${defaultAvatar.color} border-2 rounded-full flex items-center justify-center text-5xl shadow-md transform hover:rotate-6 transition-all`}>
          {defaultAvatar.emoji}
        </div>
      );
    }
    return (
      <div className="w-28 h-28 rounded-full border-4 border-rose-300 overflow-hidden shadow-lg bg-slate-100">
        <img
          src={state.avatarUrl}
          alt={state.recipientName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback if avatar URL fails to load
            (e.target as any).src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&q=80";
          }}
        />
      </div>
    );
  };

  // Generate Floating Balloons
  useEffect(() => {
    if (!envelopeOpened) return;

    const balloonColors = [
      "bg-rose-400",
      "bg-pink-400",
      "bg-cyan-400",
      "bg-amber-400",
      "bg-purple-400",
      "bg-emerald-400",
      "bg-orange-400",
    ];

    const getEmotionQuotes = () => {
      switch (emotion) {
        case "emotional":
          return [
            state.shortQuote || "You are so loved! ❤️",
            "Deeply grateful for your presence!",
            "You are a true blessing. 🥰",
            "Always and forever. 💖",
            "Sending you infinite warm hugs! 🤗",
            "A rare and beautiful soul. ✨",
            "Celebrating you today! 🎉",
            "So proud of your journey! 🌱",
          ];
        case "poetic":
          return [
            state.shortQuote || "Let your heart wander! 📜",
            "A star illuminating our lives! ⭐",
            "Stardust inside your bones. 🪐",
            "A rare diamond in the rough! 💎",
            "Like a verse written on wind. 🌾",
            "May your days compile into beauty. 💻",
            "Written in the stars above! 🌌",
          ];
        case "cute":
          return [
            state.shortQuote || "You are the sweetest! 🍭",
            "Sweet cutie pie! 🐼",
            "Warm fluffy kittens! 🐾",
            "Stay sweet, stay gold! 🦄",
            "Cupcake sprinkles! 🧁",
            "Happy cute birthday! 🎀",
            "Tons of strawberry treats! 🍓",
          ];
        case "celebratory":
          return [
            state.shortQuote || "CHAMPAGNE SHOWERS! 🍾",
            "LET'S MAKE SOME NOISE! 📣",
            "You absolute legend! 👑",
            "Raise your cups! 🥂",
            "Time to dance all night! 💃",
            "Vibrant fireworks of happiness! 🎆",
            "Unleash the disco sound! 🪩",
          ];
        case "funny":
        default:
          return [
            state.shortQuote || "At least you compiled! 👾",
            "Error 404: Youth not found! 💻",
            "Another year closer to senior discounts! 👵",
            "You age like exquisite dairy! 🧀",
            "Comically handsome/gorgeous! 🥸",
            "Still clean of bugs! 🐛",
            "Older but definitely not wiser! 🤪",
          ];
      }
    };

    const secretQuotes = getEmotionQuotes();

    const list: FloatingBalloon[] = [];
    // Generate 12 balloons with randomized placements
    for (let i = 0; i < 14; i++) {
      list.push({
        id: i,
        x: Math.floor(Math.random() * 85) + 5, // 5% to 90%
        size: Math.floor(Math.random() * 20) + 45, // 45px to 65px
        color: balloonColors[i % balloonColors.length],
        popped: false,
        quote: secretQuotes[i % secretQuotes.length],
        delay: Math.random() * 10, // staggered entrance
      });
    }
    setBalloons(list);
  }, [envelopeOpened, state.shortQuote, emotion]);

  // Handle music toggle
  const toggleAudio = () => {
    if (state.uploadedMusic) {
      if (uploadedAudioRef.current) {
        if (audioPlaying) {
          uploadedAudioRef.current.pause();
          setAudioPlaying(false);
        } else {
          uploadedAudioRef.current.play().catch(err => {
            console.warn("Audio playback issue (user click required):", err);
          });
          setAudioPlaying(true);
        }
      }
    } else {
      if (audioPlaying) {
        synth.stopMusic();
        setAudioPlaying(false);
      } else {
        synth.startMusic(state.music);
        setAudioPlaying(true);
      }
    }
  };

  // Stop music on unmount
  useEffect(() => {
    return () => {
      synth.stopMusic();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Set up microphone listener for candle blowing
  const startMicMonitoring = async () => {
    if (candlesBlown) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setMicActive(true);

      const detectBlow = () => {
        if (!analyserRef.current || candlesBlown) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        // Calculate average volume loudness level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for wind/blow detection is around 68-75
        if (average > 72) {
          triggerCandleBlow();
        } else {
          animationFrameRef.current = requestAnimationFrame(detectBlow);
        }
      };

      detectBlow();
    } catch (err) {
      console.warn("Could not activate microphone for candle blowing. Tapping fallback is available. Error:", err);
      // Fallback is silent
    }
  };

  const triggerCandleBlow = () => {
    if (candlesBlown) return;
    setCandlesBlown(true);
    synth.playSparkle();
    setTimeout(() => {
      synth.playCheer();
    }, 200);

    // Stop microphone monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setMicActive(false);

    // Blast celebratory confetti!
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const popBalloon = (id: number, quote: string, e: React.MouseEvent) => {
    synth.playPop();
    setBalloons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    // Spray custom tiny confetti bursts at clicked item coordinates
    confetti({
      particleCount: 15,
      spread: 70,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
    });

    setActiveQuoteToast(quote);
    setTimeout(() => {
      setActiveQuoteToast((current) => (current === quote ? null : current));
    }, 3500);
  };

  const openGiftBox = () => {
    if (giftDiscovered) return;
    setGiftDiscovered(true);
    synth.playSparkle();
    
    setTimeout(() => {
      synth.playCheer();
    }, 250);

    // Center explosion confetti!
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  const restartCelebrate = () => {
    setCandlesBlown(false);
    setGiftDiscovered(false);
    setEnvelopeOpened(false);
    setPinterestPage(1);
    setDearYouStep(1);
    synth.stopMusic();
    setAudioPlaying(false);
    setActiveQuoteToast(null);
    if (uploadedAudioRef.current) {
      uploadedAudioRef.current.pause();
      uploadedAudioRef.current.currentTime = 0;
    }
    if (onResetPreview) {
      onResetPreview();
    }
  };

  const triggerOpenCard = () => {
    setEnvelopeOpened(true);
    // Start chosen music automatically!
    if (state.uploadedMusic) {
      if (uploadedAudioRef.current) {
        uploadedAudioRef.current.currentTime = 0;
        uploadedAudioRef.current.play().catch(err => {
          console.warn("Autoplay audio was initially blocked by the browser. Press play manually if needed. Error:", err);
        });
        setAudioPlaying(true);
      }
    } else {
      synth.startMusic(state.music);
      setAudioPlaying(state.music !== "none");
    }
    
    // Automatically trigger mic listening if blow cake challenge is active
    if (state.interactiveChallenge === "cake" || state.interactiveChallenge === "all") {
      startMicMonitoring();
    }
  };

  // Render cake elements
  const renderInteractiveCake = () => {
    const getCakeColors = () => {
      switch (state.cakeType) {
        case "strawberry":
          return { frosting: "bg-pink-300", base: "bg-rose-400", sprinkles: "bg-pink-600" };
        case "chocolate":
          return { frosting: "bg-amber-800", base: "bg-amber-950", sprinkles: "bg-yellow-500" };
        case "unicorn":
          return { frosting: "bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300", base: "bg-indigo-300", sprinkles: "bg-purple-600" };
      }
    };

    const colors = getCakeColors();

    return (
      <div className="flex flex-col items-center justify-center py-6">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 block">
          Make a wish & blow the candles out!
        </label>

        {/* The Birthday Cake Container */}
        <div className="relative cursor-pointer transition-transform hover:scale-105" onClick={() => !candlesBlown && triggerCandleBlow()}>
          {/* Candles */}
          <div className="flex justify-center space-x-6 mb-[-12px] relative z-10">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex flex-col items-center relative">
                {/* Flame */}
                {!candlesBlown && (
                  <motion.div
                    animate={{
                      scale: [1, 1.25, 1],
                      y: [0, -2, 0],
                      skewX: [-2, 2, -2],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5 + idx * 0.1,
                      ease: "easeInOut",
                    }}
                    className="w-4 h-6 bg-gradient-to-t from-red-500 via-yellow-400 to-amber-100 rounded-full blur-[1px] absolute -top-5"
                  />
                )}
                {/* Candle Body */}
                <div className={`w-3 h-10 bg-gradient-to-b from-indigo-300 via-purple-300 to-indigo-400 border border-slate-900 rounded-sm shadow-sm relative ${candlesBlown ? "opacity-60" : ""}`}>
                  <div className="w-1/2 h-full bg-white/20 absolute left-0" />
                  {/* Wick */}
                  <div className="w-1 h-2 bg-slate-800 absolute -top-2 left-1/2 transform -translate-x-1/2" />
                </div>
              </div>
            ))}
          </div>

          {/* Cake Frosting Top Layer */}
          <div className={`w-52 h-10 ${colors.frosting} border border-slate-900 rounded-t-xl relative shadow-md`}>
            {/* Dripping effects */}
            <div className="absolute -bottom-2 left-4 w-4 h-4 rounded-full bg-inherit" />
            <div className="absolute -bottom-3 left-14 w-5 h-5 rounded-full bg-inherit" />
            <div className="absolute -bottom-2 left-24 w-4 h-4 rounded-full bg-inherit" />
            <div className="absolute -bottom-4 left-32 w-4 h-6 rounded-full bg-inherit" />
            <div className="absolute -bottom-2 left-44 w-3 h-4 rounded-full bg-inherit" />

            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-900/40">
              Happy Birthday!
            </div>
          </div>

          {/* Cake Main Body Bottom Layer */}
          <div className={`w-60 h-20 ${colors.base} border border-slate-900 rounded-b-xl relative z-[-1] overflow-hidden shadow-lg`}>
            {/* Sprinkles decoration */}
            <div className={`w-1.5 h-3 rounded-full ${colors.sprinkles} absolute top-4 left-8 rotate-45`} />
            <div className={`w-1.5 h-3 rounded-full ${colors.sprinkles} absolute top-12 left-16 -rotate-12`} />
            <div className={`w-1.5 h-3 rounded-full ${colors.sprinkles} absolute top-6 left-28 rotate-12`} />
            <div className={`w-1.5 h-3 rounded-full ${colors.sprinkles} absolute top-14 left-40 rotate-45`} />
            <div className={`w-1.5 h-3 rounded-full ${colors.sprinkles} absolute top-8 left-52 -rotate-45`} />

            {/* Inner lines */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/25" />
          </div>

          {/* Standard Plate */}
          <div className="w-64 h-3 bg-slate-350 border border-slate-900 rounded-full shadow-md mt-[-2px]" />
        </div>

        {/* Blow/Tap Help Guide */}
        <div className="mt-5 text-center">
          {candlesBlown ? (
            <div className="flex items-center justify-center space-x-2 text-emerald-500 font-bold bg-emerald-50 py-1.5 px-4 rounded-full border border-emerald-200">
              <Check className="w-5 h-5" />
              <span>Make a secret wish! 🎂</span>
            </div>
          ) : (
            <button
              onClick={triggerCandleBlow}
              className={`text-xs py-1.5 px-4 rounded-full border transition-all ${
                micActive
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse flex items-center space-x-2"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
              }`}
            >
              {micActive ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span>Blow into your microphone or CLICK the candles!</span>
                </>
              ) : (
                <span>Click / Tap candles directly to Blow them out!</span>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render Passcode Gate if required
  if (state.passcode && state.passcode.length === 4 && !passcodeVerified) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#fff1f2] via-[#faf5ff] to-[#f0fdf4] font-sans text-pink-950">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full bg-white border-4 border-[#4c0519] rounded-[32px] p-8 shadow-[8px_8px_0px_#4c0519] text-center space-y-6"
        >
          <div className="text-4xl">🔐</div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black font-sans tracking-tight">For Your Eyes Only</h1>
            <p className="text-xs text-slate-500 font-medium">This secret surprise requires a 4-digit passcode to unlock.</p>
          </div>

          <div className="flex justify-center gap-3">
            {Array.from({ length: 4 }).map((_, idx) => {
              const char = enteredPasscode[idx] || "";
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-all ${
                    passcodeError
                      ? "border-red-500 bg-red-50 text-red-600 animate-shake"
                      : char
                      ? "border-[#4c0519] bg-pink-50 text-[#4c0519]"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {char ? "•" : ""}
                </div>
              );
            })}
          </div>

          {passcodeError && (
            <p className="text-xs font-bold text-red-500 animate-pulse">
              Wrong passcode! Hint: check with the sender or try again.
            </p>
          )}

          {/* Hidden text input for typing on desktop/mobile */}
          <input
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={4}
            value={enteredPasscode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setEnteredPasscode(val);
              setPasscodeError(false);
              
              if (val.length === 4) {
                if (val === state.passcode) {
                  synth.playSparkle();
                  confetti({ particleCount: 40, spread: 40 });
                  setPasscodeVerified(true);
                } else {
                  synth.playPop();
                  setPasscodeError(true);
                  setTimeout(() => {
                    setEnteredPasscode("");
                    setPasscodeError(false);
                  }, 1200);
                }
              }
            }}
            className="w-full border border-slate-250 p-2.5 rounded-xl text-center text-xs tracking-widest bg-slate-50 border-dashed focus:outline-[#4c0519]"
            placeholder="Type code here..."
            autoFocus
          />

          <div className="text-[10px] text-slate-400 font-mono">
            Sender relationship: <span className="font-bold text-[#4c0519]">{state.relationship || "friend"}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={themeStyle.bg}>
      {/* Background decorations depending on Theme & Emotion */}
      {emotion === "emotional" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
          {/* Gentle hearts */}
          <div className="absolute top-16 right-[15%] text-rose-500/20 text-3xl animate-bounce">💖</div>
          <div className="absolute bottom-20 left-[10%] text-pink-500/30 text-2xl animate-ping">❤️</div>
        </div>
      )}

      {emotion === "poetic" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-amber-500/5 blur-3xl animate-pulse" />
          {/* Custom Stars */}
          <div className="absolute top-10 right-10 block text-amber-400/45 text-xl">✨</div>
          <div className="absolute bottom-20 left-20 block text-amber-500/35 text-lg">⭐</div>
          <div className="absolute top-40 left-[40%] text-amber-200/20 text-sm">🪐</div>
        </div>
      )}

      {emotion === "cute" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-12 left-[20%] text-pink-400/35 text-4xl">🧁</div>
          <div className="absolute bottom-16 right-[10%] text-emerald-400/25 text-3xl">🐾</div>
          <div className="absolute top-[35%] right-[20%] text-yellow-400/40 text-2xl">🧸</div>
        </div>
      )}

      {emotion === "celebratory" && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.05),transparent_40%)]">
          <div className="absolute top-12 left-20 text-yellow-500/40 text-4xl animate-pulse">🍾</div>
          <div className="absolute bottom-20 right-12 text-yellow-400/35 text-3xl animate-spin">⚡</div>
          <div className="absolute top-1/2 left-[15%] text-amber-400/30 text-xl animate-bounce">🎩</div>
        </div>
      )}

      {emotion === "funny" && theme === "midnight" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-200 rounded-full animate-ping" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-amber-300 rounded-full animate-pulse delay-500" />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-1000" />
          <div className="absolute bottom-40 right-1/3 w-3.5 h-3.5 bg-yellow-100 rounded-full opacity-40 animate-ping delay-200" />
        </div>
      )}

      {emotion === "funny" && theme === "space" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-pink-500/10 blur-3xl animate-pulse" />
          {/* Custom Stars */}
          <div className="absolute top-10 right-10 block text-indigo-400/40 text-xl">✨</div>
          <div className="absolute bottom-20 left-20 block text-pink-400/30 text-lg">⭐</div>
        </div>
      )}

      {/* Floating Sparkles for Disco */}
      {emotion === "funny" && theme === "disco" && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Mirror Disco Ball */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-1 h-12 bg-slate-400" />
            <div className="w-12 h-12 rounded-full bg-slate-300 border-2 border-slate-400 animate-spin flex items-center justify-center p-0.5 border-dashed">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-cyan-400 opacity-65" />
            </div>
          </div>
        </div>
      )}

      {/* Media Controller HUD */}
      {envelopeOpened && (
        <div className="absolute top-4 right-4 z-40 bg-white/15 backdrop-blur-md rounded-full shadow-md py-1.5 px-3.5 border border-white/20 flex items-center space-x-3 text-slate-800 dark:text-white">
          <span className="text-xs font-mono opacity-80 uppercase tracking-widest hidden md:inline">
            Sound: {state.music}
          </span>
          <button
            onClick={toggleAudio}
            className="p-1 px-2 rounded-full hover:bg-white/20 transition-all flex items-center"
            title="Toggle Music Theme"
          >
            {audioPlaying ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-red-400" />
            )}
          </button>
        </div>
      )}

      {/* Active Balloon Toast HUD */}
      <AnimatePresence>
        {activeQuoteToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 border border-amber-400/50 text-white font-bold py-3 px-6 rounded-full shadow-2xl flex items-center space-x-3 text-sm tracking-wide max-w-sm text-center"
          >
            <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-bounce" />
            <span>{activeQuoteToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 1: UNOPENED ENVELOPE / SPLASH SCREEN */}
      <AnimatePresence>
        {!envelopeOpened && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full text-center bg-[#15122e] border-2 border-indigo-400/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              id="birthday-envelope-card"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
              <div className="text-5xl mb-4 animate-bounce">✉️</div>
              
              <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                A Surprising Wish is Waiting!
              </h1>
              
              <p className="text-indigo-200/80 font-light text-sm mb-6">
                A custom personalized interactive birthday card has been hand-crafted for{" "}
                <strong className="text-amber-400 font-bold">{state.recipientName}</strong>. 
                Turn on your audio for the optimal festive animation experience!
              </p>

              <div className="border border-indigo-500/20 rounded-2xl p-4 bg-slate-900/40 mb-6 flex flex-col items-center justify-center">
                <span className="text-xs text-indigo-300 font-mono tracking-wider uppercase mb-1">Surprise from</span>
                <span className="text-lg font-black text-white bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300">
                  {state.relationship ? `Your ${state.relationship}` : "A Loving Buddy"}
                </span>
              </div>

              <button
                onClick={triggerOpenCard}
                className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg border border-rose-400/30 transition-transform active:scale-95 flex items-center justify-center space-x-3 group"
              >
                <span>OPEN SURPRISE CARD</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BALLOONS BACKGROUND LAYER */}
      {envelopeOpened && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {balloons.map(
            (b) =>
              !b.popped && (
                <motion.div
                  key={b.id}
                  initial={{ y: "110vh", x: `${b.x}vw` }}
                  animate={{ y: "-20vh" }}
                  transition={{
                    duration: 10 + b.id * 1.5,
                    repeat: Infinity,
                    delay: b.delay,
                    ease: "linear",
                  }}
                  onClick={(e) => {
                    // Stop event propagation because parent may click other triggers
                    e.stopPropagation();
                    popBalloon(b.id, b.quote, e);
                  }}
                  className={`absolute rounded-full cursor-pointer pointer-events-auto transform hover:scale-110 flex items-center justify-center select-none shadow-md ${b.color}`}
                  style={{
                    width: `${b.size}px`,
                    height: `${b.size * 1.3}px`,
                  }}
                >
                  {emotion === "emotional" ? (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                      ❤️
                    </div>
                  ) : emotion === "poetic" ? (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">
                      ✨
                    </div>
                  ) : emotion === "cute" ? (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      🧁
                    </div>
                  ) : emotion === "celebratory" ? (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl animate-bounce">
                      🥂
                    </div>
                  ) : (
                    <>
                      {/* Balloon string */}
                      <div className="w-0.5 h-16 bg-slate-900/10 absolute -bottom-16 left-1/2 transform -translate-x-1/2" />
                      {/* Floating particle sparkle inside balloon */}
                      <div className="w-1/3 h-1/3 bg-white/25 rounded-full absolute top-1.5 left-2" />
                      <span className="text-xs pointer-events-none drop-shadow">🎈</span>
                    </>
                  )}
                </motion.div>
              )
          )}
        </div>
      )}
      {/* MAIN CARDS CONTENT CONTAINER */}
      {envelopeOpened && (
        state.isDearYou ? (
          /* Render Dear You Scrapbook Book */
          <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 flex flex-col justify-center min-h-screen relative z-20 font-sans text-[#4c0519] select-none">
            {/* Cute floating sparkles and paper theme accents */}
            <div className="absolute top-10 left-10 text-xl opacity-50 animate-float">💌</div>
            <div className="absolute top-20 right-12 text-2xl opacity-50 animate-float delay-1000">✨</div>
            <div className="absolute bottom-16 left-16 text-lg opacity-50 animate-float delay-2000">🎈</div>

            {/* Top Persistent Progress Indicator & Clickable Navigation Tabs */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1 max-w-xl mx-auto text-[10px] md:text-xs font-bold tracking-widest uppercase bg-amber-50/80 dark:bg-slate-900/60 p-2 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-xs relative z-30">
              {[1, 2, 3, 4, 5, 6, 7].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    synth.playSparkle();
                    setDearYouStep(pageNum);
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    dearYouStep === pageNum
                      ? "bg-amber-600 text-white font-black shadow-xs"
                      : "text-amber-800 dark:text-amber-400 hover:bg-amber-100/50 font-semibold"
                  }`}
                >
                  Step {pageNum}
                </button>
              ))}
            </div>

            {/* Main Polaroid / Scrapbook Card Deck */}
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ 
                borderLeftColor: state.dearYouAccent || "#B33A2E", 
                borderRightColor: state.dearYouAccent || "#B33A2E", 
                borderBottomColor: state.dearYouAccent || "#B33A2E", 
                borderTopColor: state.dearYouAccent || "#B33A2E" 
              }}
              className="bg-[#faf6f0] dark:bg-slate-900 rounded-[32px] border-4 shadow-[10px_10px_0px_#4c0519] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[500px]"
            >
              <AnimatePresence mode="wait">
                {dearYouStep === 1 && (
                  <motion.div
                    key="dy1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-6 text-center space-y-6"
                  >
                    <div className="text-5xl animate-bounce">💌</div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold tracking-widest text-amber-600 uppercase">dear you...</h3>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#4c0519] dark:text-amber-100 font-handwriting">
                        A Beautiful Birthday Story
                      </h2>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        A cozy hand-crafted scrapbook has been made with so much love to celebrate another wonderful year of your life.
                      </p>
                    </div>

                    <div className="p-4 bg-white/60 dark:bg-slate-950/40 rounded-2xl border border-dashed border-amber-200 dark:border-amber-900/30 inline-block">
                      <span className="text-[10px] text-slate-450 block font-mono">RECIPIENT:</span>
                      <span className="text-xl font-black text-[#4c0519] dark:text-amber-200 block font-handwriting">{state.recipientName}</span>
                    </div>

                    <button
                      onClick={() => {
                        synth.playSparkle();
                        setDearYouStep(2);
                      }}
                      style={{ backgroundColor: state.dearYouAccent || "#B33A2E" }}
                      className="mx-auto px-6 py-3 text-white text-xs font-black tracking-widest uppercase rounded-full shadow-lg hover:brightness-115 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 border-0"
                    >
                      <span>Begin Story</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {dearYouStep === 2 && (
                  <motion.div
                    key="dy2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 flex flex-col items-center space-y-4 text-center"
                  >
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Page 2: Our Favorite Person</span>
                    
                    {/* Polaroid Frame */}
                    <div className="bg-white p-3 pb-8 rounded-sm shadow-xl border border-slate-250/50 max-w-xs rotate-[-2deg] hover:rotate-0 transition-transform duration-300 relative group">
                      <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-4 bg-amber-200/50 border border-amber-300/20 rotate-[-1deg] rounded-sm flex items-center justify-center shadow-xs" />
                      <div className="aspect-square w-60 h-60 bg-amber-50/50 overflow-hidden rounded-xs border border-slate-100">
                        {state.dearYouFavoritePhoto ? (
                          <img src={state.dearYouFavoritePhoto} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-amber-100 text-[#4c0519]">
                            <span className="text-4xl animate-float">🥰</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 font-handwriting text-[#4c0519] italic text-md text-center max-w-[220px] mx-auto min-h-[40px] flex items-center justify-center">
                        "{state.dearYouFavoriteQuote || "the one who brightens every ordinary Tuesday with magic."}"
                      </div>
                    </div>
                  </motion.div>
                )}

                {dearYouStep === 3 && (
                  <motion.div
                    key="dy3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 flex flex-col items-center space-y-4"
                  >
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Page 3: Cozy Album</span>
                      <h3 className="text-2xl font-black mt-1 text-[#4c0519] dark:text-amber-100 font-handwriting">{state.dearYouMemoryCaption || "sweet chapters of us ♡"}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto py-2">
                      {[
                        { key: "dearYouMem0", rotate: "rotate-[-3deg]", fallbackEmoji: "📸" },
                        { key: "dearYouMem1", rotate: "rotate-[2deg]", fallbackEmoji: "☕" },
                        { key: "dearYouMem2", rotate: "rotate-[1.5deg]", fallbackEmoji: "🎒" },
                        { key: "dearYouMem3", rotate: "rotate-[-1.5deg]", fallbackEmoji: "🥐" }
                      ].map((mem, idx) => {
                        const imgUrl = (state as any)[mem.key];
                        return (
                          <div
                            key={mem.key}
                            className={`bg-white p-2 pb-5 rounded-xs border border-slate-200 shadow-md flex flex-col items-center relative group transition-transform hover:scale-105 hover:rotate-0 ${mem.rotate}`}
                          >
                            <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-10 h-3 bg-amber-200/40 border border-amber-300/10 rotate-[-1deg]" />
                            <div className="aspect-square w-full bg-slate-50/50 rounded-xs overflow-hidden border border-slate-100 flex items-center justify-center">
                              {imgUrl ? (
                                <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-2xl">{mem.fallbackEmoji}</span>
                              )}
                            </div>
                            <span className="mt-1.5 text-[9px] font-mono font-bold text-slate-400">#memory0{idx + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {dearYouStep === 4 && (
                  <motion.div
                    key="dy4"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 text-center flex flex-col items-center space-y-4"
                  >
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Page 4: Make A Wish</span>
                    <h3 className="text-xl font-extrabold text-[#4c0519] dark:text-amber-100">
                      Blow out the candles! 🎂
                    </h3>
                    
                    {/* Render customized cake */}
                    <div className="relative scale-90 md:scale-95 my-4" onClick={() => !candlesBlown && triggerCandleBlow()}>
                      {/* Candles list */}
                      <div className="flex justify-center space-x-3 mb-[-12px] relative z-10">
                        {Array.from({ length: Math.min(12, state.dearYouAge || 7) }).map((_, idx) => (
                          <div key={idx} className="flex flex-col items-center relative">
                            {/* Flame */}
                            {!candlesBlown && (
                              <motion.div
                                animate={{
                                  scale: [1, 1.25, 1],
                                  y: [0, -2, 0],
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.4 + idx * 0.05,
                                  ease: "easeInOut",
                                }}
                                className="w-2.5 h-4 bg-gradient-to-t from-red-500 via-yellow-400 to-amber-100 rounded-full blur-[1px] absolute -top-4"
                              />
                            )}
                            {/* Candle Body */}
                            <div className={`w-2 h-8 bg-gradient-to-b from-amber-300 to-amber-500 border border-slate-900 rounded-sm ${candlesBlown ? "opacity-60" : ""}`} />
                          </div>
                        ))}
                      </div>

                      {/* Cake layers */}
                      <div className="w-44 h-8 bg-pink-350 border border-slate-900 rounded-t-lg relative shadow-md">
                        {/* Dripping frosting */}
                        <div className="absolute -bottom-1.5 left-2 w-3 h-3 rounded-full bg-inherit" />
                        <div className="absolute -bottom-2 left-10 w-4 h-4 rounded-full bg-inherit" />
                        <div className="absolute -bottom-1.5 left-24 w-3 h-3 rounded-full bg-inherit" />
                        <div className="absolute -bottom-2 left-32 w-3.5 h-4 rounded-full bg-inherit" />
                      </div>
                      <div className="w-52 h-16 bg-amber-100 border border-slate-900 rounded-b-lg relative z-[-1] overflow-hidden flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-800/40 font-handwriting">
                        Happy Birthday
                      </div>
                      {/* Plate */}
                      <div className="w-56 h-2.5 bg-slate-350 border border-slate-900 rounded-full shadow-md mt-[-2px] mx-auto" />
                    </div>

                    <div className="mt-2 text-center">
                      {candlesBlown ? (
                        <div className="inline-flex items-center space-x-1.5 text-emerald-600 bg-emerald-50 px-4 py-1 rounded-full border border-emerald-200 text-xs font-bold">
                          <Check className="w-4 h-4" />
                          <span>Secret wish blown into the universe!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => !candlesBlown && triggerCandleBlow()}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-1.5 rounded-full shadow-sm animate-pulse cursor-pointer border-0"
                        >
                          Tap to Blow Out Candles
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {dearYouStep === 5 && (
                  <motion.div
                    key="dy5"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 flex flex-col items-center space-y-4 text-center"
                  >
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Page 5: The Big Reveal</span>
                    <h3 className="text-2xl font-black text-[#4c0519] dark:text-amber-150 leading-tight font-handwriting">
                      {state.dearYouHeadline || "a lifetime of happy moments with you"}
                    </h3>

                    {/* High-quality polaroid reveal */}
                    <div className="bg-white p-3 pb-8 rounded-sm shadow-xl border border-slate-200/60 max-w-xs relative group">
                      <div className="aspect-square w-64 h-64 bg-amber-50 overflow-hidden border border-slate-100 rounded-xs">
                        {state.dearYouHeadlinePhoto ? (
                          <img src={state.dearYouHeadlinePhoto} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-rose-100 to-indigo-100 text-[#4c0519]">
                            <span className="text-4xl animate-pulse">🎉</span>
                          </div>
                        )}
                      </div>
                      <span className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-300">#thereveal</span>
                    </div>
                  </motion.div>
                )}

                {dearYouStep === 6 && (
                  <motion.div
                    key="dy6"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 text-center flex flex-col items-center space-y-4"
                  >
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Page 6: A Handwritten Note</span>
                    
                    {/* Notebook Paper layout */}
                    <div className="w-full max-w-md bg-[#fffdf9] dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-dashed border-amber-300 dark:border-amber-900/50 shadow-md relative overflow-hidden text-left font-handwriting">
                      {/* Notebook lines */}
                      <div className="absolute top-0 bottom-0 left-8 w-[1px] bg-red-200/50" />
                      
                      <div className="pl-6 space-y-4">
                        <span className="text-2xl">✍️</span>
                        <p className="text-xs md:text-sm leading-loose whitespace-pre-wrap text-slate-800 dark:text-slate-350 italic">
                          {state.dearYouNoteText || "Happy birthday to my favorite person. Grateful for every big adventure and every quiet walk we share. You deserve the entire world."}
                        </p>
                      </div>

                      {/* Small accent photo nested inside paper */}
                      {state.dearYouNotePhoto && (
                        <div className="mt-4 flex justify-end">
                          <div className="bg-white p-1 pb-3 rounded-xs border border-slate-200 shadow-sm rotate-[3deg] max-w-[80px]">
                            <img src={state.dearYouNotePhoto} className="w-16 h-16 object-cover rounded-xs" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {dearYouStep === 7 && (
                  <motion.div
                    key="dy7"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-6 text-center space-y-6"
                  >
                    <div className="text-5xl animate-bounce">💖</div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold tracking-widest text-amber-600 uppercase">forever and always</h3>
                      <p className="text-md md:text-lg italic font-handwriting font-bold leading-relaxed text-[#4c0519] dark:text-amber-100 max-w-sm mx-auto">
                        "{state.dearYouFinalMessage || "Here's to another trip around the sun, with me right beside you."}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-dashed border-amber-200 dark:border-amber-900/20 max-w-xs mx-auto">
                      <span className="text-[10px] text-slate-450 font-mono block">SIGNED WITH LOVE BY</span>
                      <span className="text-lg font-black bg-clip-text text-[#4c0519] dark:text-amber-200 font-handwriting">
                        {state.dearYouSenderName || "Sam"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        synth.playCheer();
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                        restartCelebrate();
                      }}
                      style={{ backgroundColor: state.dearYouAccent || "#B33A2E" }}
                      className="mx-auto px-6 py-3 text-white text-xs font-black tracking-widest uppercase rounded-full shadow-lg cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 border-0 font-sans"
                    >
                      <span>Complete Story ♡</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation controls */}
              <div className="mt-8 pt-4 border-t border-dashed border-amber-200/50 flex items-center justify-between w-full">
                <button
                  type="button"
                  disabled={dearYouStep === 1}
                  onClick={() => setDearYouStep(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 text-xs text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100/60 rounded-lg font-bold border border-amber-100 disabled:opacity-40 cursor-pointer"
                >
                  ← Back
                </button>

                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5,6,7].map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setDearYouStep(pageNum)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${dearYouStep === pageNum ? 'bg-amber-600 scale-120' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>

                {dearYouStep < 7 ? (
                  <button
                    type="button"
                    onClick={() => {
                      synth.playSparkle();
                      setDearYouStep(p => p + 1);
                    }}
                    style={{ backgroundColor: state.dearYouAccent || "#B33A2E" }}
                    className="px-3.5 py-1.5 text-xs text-white rounded-lg font-bold shadow-xs flex items-center space-x-1 cursor-pointer border-0"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      synth.playCheer();
                      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                      restartCelebrate();
                    }}
                    className="px-3.5 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-bold flex items-center space-x-1 cursor-pointer shadow-md"
                  >
                    <span>Celebrate! ♡</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        ) : state.isPinterestCard ? (
          /* Render Pinterest Book */
          <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 flex flex-col justify-center min-h-screen relative z-20 font-space selection:bg-rose-100 selection:text-rose-900">
            {/* Cute top floating pastel sparkles decoration */}
            <div className="absolute top-10 left-10 text-xl opacity-40 animate-float">🌸</div>
            <div className="absolute top-20 right-12 text-2xl opacity-40 animate-float delay-1000">🧸</div>
            <div className="absolute bottom-16 left-16 text-lg opacity-40 animate-float delay-2000">🧁</div>

            {/* Top Persistent Progress Indicator & Clickable Navigation Tabs */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 md:gap-2.5 max-w-xl mx-auto text-[10px] md:text-xs font-bold tracking-widest uppercase select-none font-sans bg-rose-50/80 dark:bg-slate-900/60 p-2 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-xs relative z-30">
              {[1, 2, 3, 4, 5].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    synth.playSparkle();
                    setPinterestPage(pageNum);
                  }}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    pinterestPage === pageNum
                      ? "bg-[#ec4899] text-white font-black shadow-xs animate-pulse-gentle"
                      : "text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 font-semibold"
                  }`}
                >
                  Page {pageNum}
                </button>
              ))}
            </div>

            {/* Main Polaroid Deck */}
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-tr from-[#fff1f3] via-[#faf6fe] to-[#f0f9ff] text-pink-950 rounded-[32px] border-4 border-[#4c0519] shadow-[10px_10px_0px_#4c0519] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[550px] md:min-h-[580px]"
            >
              <AnimatePresence mode="wait">
                {pinterestPage === 1 && (
                  <motion.div
                    key="p1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-6 space-y-6"
                  >
                    <motion.span 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xs font-bold font-mono text-rose-500 bg-white/80 border border-rose-200 px-4 py-1.5 rounded-full tracking-wider animate-pulse-gentle shadow-xs"
                    >
                      {state.pinterestHeroBadge || "♡ a birthday surprise"}
                    </motion.span>
                    
                    <div className="space-y-3">
                      <h1 className="text-3xl md:text-5xl font-serif font-bold text-rose-600/90 tracking-tight lowercase pt-2 leading-tight">
                        {state.pinterestHeroHeading || "a little something for you"}
                      </h1>
                      <p className="text-xs md:text-sm text-slate-500/80 font-mono tracking-tight lowercase">
                        {state.pinterestHeroSubtitle || "happy birthday ♡"}
                      </p>
                    </div>

                    {/* Elegant Cupcake */}
                    <div className="relative py-2 flex flex-col items-center">
                      <motion.div 
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                        className="text-7xl cursor-pointer select-none"
                        onClick={() => {
                          synth.playSparkle();
                          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
                        }}
                      >
                        🧁
                      </motion.div>
                      <div className="w-16 h-1 w-full bg-[#4c0519]/5 blur-[2px] rounded-full mx-auto mt-2" />
                      <span className="text-[10px] text-slate-400 font-mono mt-3 uppercase tracking-widest animate-pulse">tap vanilla cupcake</span>
                    </div>
                  </motion.div>
                )}

                {pinterestPage === 2 && (
                  <motion.div
                    key="p2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="flex flex-col justify-between py-2 space-y-4 w-full"
                  >
                    <div className="bg-white/80 rounded-3xl p-6 md:p-8 shadow-sm border border-rose-100 relative max-w-md mx-auto w-full">
                      {/* Decorative Tape */}
                      <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 w-28 h-7 bg-rose-200/50 border border-rose-300/30 rotate-1 rounded-sm shadow-xs flex items-center justify-center">
                        <span className="text-[8px] tracking-wider text-rose-800/80 uppercase font-sans font-black">sealed with love</span>
                      </div>

                      <div className="space-y-4 pt-3 text-center">
                        <h3 className="text-2xl font-serif font-black text-rose-600 tracking-tight leading-none pt-2">
                          {state.pinterestLetterTitle || "Happy Birthday"}
                        </h3>
                        
                        <p className="text-xs md:text-sm text-slate-705 font-serif leading-relaxed tracking-wider lowercase italic whitespace-pre-wrap">
                          {state.pinterestLetterParagraph || "happy birthday to my favourite human. thank you for bringing so much light and warm laughter into my life. i cherish every tiny moment we share together, from the quiet walks to the chaotic plans."}
                        </p>
                      </div>
                    </div>

                    {/* Tape deck Cassette player */}
                    <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/30 flex items-center gap-3.5 max-w-sm mx-auto w-full">
                      <button 
                        onClick={() => {
                          if (audioPlaying) {
                            synth.stopMusic();
                            setAudioPlaying(false);
                          } else {
                            synth.startMusic(state.music || "piano");
                            setAudioPlaying(true);
                          }
                        }}
                        className={`p-2.5 rounded-full cursor-pointer transition-colors ${audioPlaying ? 'bg-rose-450 text-white animate-spin-slow' : 'bg-slate-200 text-slate-600'}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block font-mono">soundtrack chosen 🎵</span>
                        <span className="text-[10px] text-slate-500 font-serif italic tracking-tight leading-snug truncate block lowercase">
                          {state.pinterestSongCaption || "press play — i picked this song because it always reminds me of you."}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {pinterestPage === 3 && (
                  <motion.div
                    key="p3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 w-full flex flex-col items-center select-none"
                  >
                    <div className="text-center mb-4">
                      <span className="text-[10px] font-bold font-mono tracking-widest text-[#db2777] uppercase block mb-0.5">Our memories ♡</span>
                      <h3 className="text-xl md:text-2xl font-serif font-bold text-rose-600 lowercase tracking-tight leading-none mb-0.5">digital scrapbook grid</h3>
                      <p className="text-[10px] text-slate-500 lowercase font-medium">every single moment we spend together is a sweet treasure...</p>
                    </div>

                    {/* Collage Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-xl mx-auto px-1 py-1">
                      {(() => {
                        const items = getPolaroidMemories();
                        const defaultEmojis = ["🧸", "🧁", "🐾", "⭐", "🍒", "🌸"];
                        const defaultTitles = ["happy moment", "sweet chats", "cozy walking", "dreaming stars", "cherry laughter", "blossom hearts"];
                        const defaultCaptions = [
                          state.pinterestMemory1 || "the bright smiles we share whenever we meet up ♡",
                          state.pinterestMemory2 || "sipping cozy lattes and losing track of time talking...",
                          state.pinterestMemory3 || "just really, truly thankful that i get to spend another year by your side",
                          "sharing sweet inside jokes that make us laugh till our cheeks hurt!",
                          "enjoying delicious sweet cupcakes and cozy caramel macchiatos",
                          "sending you an ocean of warm teddy cuddles and bubble sparkles!"
                        ];
                        const defaultLetterBadges = ["i", "l", "o", "v", "e", "u"];
                        
                        const gridItems = Array.from({ length: 6 }).map((_, idx) => {
                          const existingItem = items[idx % items.length];
                          return {
                            photo: existingItem?.photo || "",
                            emoji: existingItem?.emoji || defaultEmojis[idx],
                            title: existingItem?.photo ? (existingItem?.title || defaultTitles[idx]) : defaultTitles[idx],
                            caption: existingItem?.photo ? (existingItem?.caption || defaultCaptions[idx]) : defaultCaptions[idx],
                            badge: defaultLetterBadges[idx],
                            rotate: idx % 3 === 0 ? "rotate-[-3deg]" : idx % 3 === 1 ? "rotate-[2deg]" : "rotate-[-1.5deg]"
                          };
                        });

                        return gridItems.map((item, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                            className={`bg-white p-2 pb-4 rounded-sm border border-slate-200/55 shadow-[3px_3px_10px_rgba(0,0,0,0.05)] flex flex-col items-center justify-between text-center relative group transition-all ${item.rotate}`}
                          >
                            <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 w-12 h-3.5 bg-rose-200/60 border border-rose-300/20 rotate-[-1deg] rounded-sm flex items-center justify-center shadow-xs select-none">
                              <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.45)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.45)_50%,rgba(255,255,255,0.45)_75%,transparent_75%,transparent)] bg-[size:10px_10px]" />
                            </div>

                            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center font-handwriting font-black text-[10px] shadow-sm border border-white select-none z-10">
                              {item.badge}
                            </div>

                            <div className="aspect-square w-full bg-rose-50/30 rounded-xs overflow-hidden flex items-center justify-center relative border border-slate-100 shadow-inner">
                              {item.photo ? (
                                <img
                                  src={item.photo}
                                  alt="Scrapbook Grid Memory"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="text-center p-1">
                                  <span className="text-2xl animate-float block">{item.emoji}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-1.5 w-full font-handwriting">
                              <h4 className="text-[11px] font-bold text-rose-600 leading-none truncate lowercase">{item.title}</h4>
                              <p className="text-[9px] text-slate-500 leading-tight mt-0.5 lowercase h-6 overflow-hidden line-clamp-2">
                                {item.caption}
                              </p>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                  </motion.div>
                )}

                {pinterestPage === 4 && (
                  <motion.div
                    key="p4"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-1 max-w-md mx-auto w-full text-center select-none"
                  >
                    <div className="bg-white/95 rounded-3xl p-5 md:p-6 border-4 border-[#4c0519] shadow-[6px_6px_0px_#4c0519] space-y-4">
                      <span className="text-[10px] font-bold text-[#f43f5e] font-mono tracking-widest block uppercase">Make a wish ♡</span>
                      
                      {/* Interactive Cake Section */}
                      <div className="flex flex-col items-center justify-center py-2 relative">
                        {/* The Birthday Cake Container */}
                        <div className="relative cursor-pointer scale-90 transition-transform hover:scale-95" onClick={() => !candlesBlown && triggerCandleBlow()}>
                          {/* Candles */}
                          <div className="flex justify-center space-x-6 mb-[-12px] relative z-10">
                            {[1, 2, 3].map((idx) => (
                              <div key={idx} className="flex flex-col items-center relative">
                                {/* Flame */}
                                {!candlesBlown && (
                                  <motion.div
                                    animate={{
                                      scale: [1, 1.25, 1],
                                      y: [0, -2, 0],
                                      skewX: [-2, 2, -2],
                                    }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 0.5 + idx * 0.1,
                                      ease: "easeInOut",
                                    }}
                                    className="w-4 h-6 bg-gradient-to-t from-red-500 via-yellow-400 to-amber-100 rounded-full blur-[1px] absolute -top-5"
                                  />
                                )}
                                {/* Candle Body */}
                                <div className={`w-3 h-10 bg-gradient-to-b from-indigo-300 via-purple-300 to-indigo-400 border border-slate-900 rounded-sm shadow-sm relative ${candlesBlown ? "opacity-60" : ""}`}>
                                  <div className="w-1/2 h-full bg-white/20 absolute left-0" />
                                  <div className="w-1/2 h-full bg-black/10 absolute right-0" />
                                  <div className="w-1 h-2 bg-slate-800 absolute -top-2 left-1/2 transform -translate-x-1/2" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Cake Layers */}
                          {(() => {
                            const getCakeColors = () => {
                              switch (state.cakeType) {
                                case "strawberry":
                                  return { frosting: "bg-pink-300", base: "bg-rose-450", sprinkles: "bg-pink-650" };
                                case "chocolate":
                                  return { frosting: "bg-amber-800", base: "bg-amber-955", sprinkles: "bg-yellow-500" };
                                case "unicorn":
                                  return { frosting: "bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300", base: "bg-indigo-300", sprinkles: "bg-purple-650" };
                                default:
                                  return { frosting: "bg-pink-300", base: "bg-rose-450", sprinkles: "bg-pink-650" };
                              }
                            };
                            const c = getCakeColors();
                            return (
                              <>
                                <div className={`w-48 h-9 ${c.frosting} border border-slate-900 rounded-t-xl relative shadow-md`}>
                                  <div className="absolute -bottom-1.5 left-4 w-3.5 h-3.5 rounded-full bg-inherit" />
                                  <div className="absolute -bottom-2.5 left-12 w-4 h-4 rounded-full bg-inherit" />
                                  <div className="absolute -bottom-1.5 left-20 w-3.5 h-3.5 rounded-full bg-inherit" />
                                  <div className="absolute -bottom-3 left-28 w-4.5 h-5 rounded-full bg-inherit" />
                                  <div className="absolute -bottom-1.5 left-38 w-3 h-3.5 rounded-full bg-inherit" />
                                  <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] uppercase tracking-wider text-slate-900/30">
                                    Happy Birthday!
                                  </div>
                                </div>
                                <div className={`w-56 h-18 ${c.base} border border-slate-900 rounded-b-xl relative z-[-1] overflow-hidden shadow-lg`}>
                                  <div className={`w-1.5 h-3 rounded-full ${c.sprinkles} absolute top-3 left-6 rotate-45`} />
                                  <div className={`w-1.5 h-3 rounded-full ${c.sprinkles} absolute top-10 left-14 -rotate-12`} />
                                  <div className={`w-1.5 h-3 rounded-full ${c.sprinkles} absolute top-5 left-24 rotate-12`} />
                                  <div className={`w-1.5 h-3 rounded-full ${c.sprinkles} absolute top-12 left-34 rotate-45`} />
                                  <div className={`w-1.5 h-3 rounded-full ${c.sprinkles} absolute top-7 left-46 -rotate-45`} />
                                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20" />
                                </div>
                                <div className="w-60 h-2.5 bg-slate-300 border border-slate-900 rounded-full shadow-md mt-[-2px]" />
                              </>
                            );
                          })()}
                        </div>

                        {/* Blow Button Trigger */}
                        <div className="mt-3 text-center">
                          {candlesBlown ? (
                            <div className="flex items-center justify-center space-x-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 py-1 px-3 rounded-full text-xs">
                              <span className="text-sm">🌟</span>
                              <span>Make a secret wish! Candles Blown!</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerCandleBlow}
                              className="px-5 py-1.5 bg-rose-500 hover:bg-rose-600 border border-slate-900 shadow-xs text-white text-[11px] font-black uppercase tracking-wider rounded-full cursor-pointer transition-transform active:scale-95 flex items-center space-x-1"
                            >
                              <span>Blow Candles! 💨</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Wish Spinner Section (Unlocked after candles blown) */}
                      {candlesBlown && (
                        <div className="pt-2 border-t border-dashed border-rose-100 flex flex-col items-center">
                          <AnimatePresence mode="wait">
                            {activeWish ? (
                              <motion.div
                                key={activeWish}
                                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: -10 }}
                                className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100 text-center text-xs text-rose-950 font-serif leading-relaxed italic relative max-w-sm"
                              >
                                <span className="px-1 block">{activeWish}</span>
                              </motion.div>
                            ) : (
                              <div className="py-2 text-[10px] text-slate-400 italic font-mono lowercase">
                                spin to unwrap your cute birthday blessing...
                              </div>
                            )}
                          </AnimatePresence>

                          <button
                            type="button"
                            onClick={() => {
                              if (isSpinningWish) return;
                              setIsSpinningWish(true);
                              synth.playSparkle();
                              
                              let count = 0;
                              const wishesArr = [
                                "may your day be filled with warm lattes & soft puppy cuddles! 🍵🐶",
                                "wishing you zero database lag and infinite coffee refills today! 💻☕",
                                "may all your dreams compile with zero errors today! ✨🐾",
                                "sending you a celestial bubble of infinite warm hugs and cozy lavender hoodies! 💜",
                                "may your heart be as full and fluffy as a basket of tiny purring kittens! 🐱🌸",
                                "happy birthday! hope your path is sprinkled with endless stars! ⭐🧁",
                                "wishing you a year of cozy afternoons, peaceful strolls, and true handholders! 🧸🌷",
                                "may you always find reasons to laugh until your pink cheeks hurt! 😄🎀",
                                "sending you sweet virtual cakes with extra pastel star sprinkles on top! 🎂💫",
                                "happy birthday to the most wonderful soul who makes this world so bright! 💖✨"
                              ];

                              const timer = setInterval(() => {
                                setActiveWish(wishesArr[Math.floor(Math.random() * wishesArr.length)]);
                                count++;
                                if (count > 10) {
                                  clearInterval(timer);
                                  const finalWish = wishesArr[Math.floor(Math.random() * wishesArr.length)];
                                  setActiveWish(finalWish);
                                  setIsSpinningWish(false);
                                  confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
                                  synth.playCheer();
                                }
                              }, 80);
                            }}
                            disabled={isSpinningWish}
                            className="mt-3 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[10px] font-bold tracking-wider uppercase cursor-pointer rounded-full transition-all"
                          >
                            <span>{isSpinningWish ? "spinning blessings..." : "SPIN FOR SURPRISE WISH ♡"}</span>
                          </button>
                        </div>
                      )}

                      <div className="pt-2 border-t border-dashed border-rose-100">
                        <p className="text-[11px] text-slate-500 font-serif leading-relaxed italic lowercase">
                          {state.pinterestWishParagraph || "thank you for being you — for the infinite patience, the late-night heart-to-hearts, and the silly inside jokes."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {pinterestPage === 5 && (
                  <motion.div
                    key="p5"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="py-2 max-w-md mx-auto w-full"
                  >
                    <div className="bg-gradient-to-tr from-[#fbf8ff] to-[#f3ebff] border-4 border-[#4c0519] p-6 md:p-8 rounded-[32px] shadow-[6px_6px_0px_#4c0519] space-y-4 font-serif text-slate-800 overflow-hidden relative">
                      {/* Postage Stamps and Cute Pixel Art Header */}
                      <div className="absolute top-4 right-4 w-12 h-14 bg-rose-50 border-2 border-dashed border-rose-300 flex flex-col items-center justify-center p-1 font-sans rotate-6 shadow-xs select-none">
                        <span className="text-[6px] text-rose-400 font-bold tracking-tighter block uppercase">Love Stamp</span>
                        <span className="text-md mt-0.5">🧸</span>
                      </div>

                      <div className="pt-2 space-y-4 text-center md:text-left">
                        <div className="flex flex-col items-center md:items-start space-y-1.5 border-b border-dashed border-purple-200 pb-3">
                          <span className="text-2xl">💌</span>
                          <h4 className="text-xl font-bold text-rose-600 lowercase tracking-tight leading-none">
                            {state.pinterestFinalTitle || "happy birthday ♡"}
                          </h4>
                        </div>
                        
                        <p className="text-xs md:text-sm leading-relaxed italic whitespace-pre-wrap lowercase text-slate-700 min-h-[140px] text-left">
                          {state.pinterestFinalLetter || "happy birthday once again. i hope this new chapter brings you so many cozy afternoons, sweet achievements, and gentle smiles. i'll always be here to support you."}
                        </p>

                        <div className="pt-2 text-right">
                          <span className="text-xs font-sans text-purple-650 font-black tracking-widest block italic">with all my love ♡</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CARD DECK PAGINATION CONTROLS */}
              <div className="mt-8 pt-4 border-t border-[#4c0519]/10 flex items-center justify-between w-full">
                <button
                  type="button"
                  disabled={pinterestPage === 1}
                  onClick={() => setPinterestPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 rounded-lg font-bold border border-rose-100 disabled:opacity-40 cursor-pointer"
                >
                  ← Back
                </button>

                {/* Page dots indicator */}
                <div className="flex items-center space-x-1.5 select-none">
                  {[1,2,3,4,5].map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPinterestPage(pageNum)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all ${pinterestPage === pageNum ? 'bg-rose-500 scale-120' : 'bg-slate-300/60'}`}
                    />
                  ))}
                </div>

                {pinterestPage < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      synth.playSparkle();
                      setPinterestPage(p => p + 1);
                    }}
                    className="px-3.5 py-1.5 text-xs text-white bg-rose-500 hover:bg-rose-600 rounded-lg font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      synth.playCheer();
                      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                      restartCelebrate();
                    }}
                    className="px-3.5 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-bold flex items-center space-x-1 cursor-pointer shadow-md"
                  >
                    <span>Finish! ♡</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* RETRY / RESET CELEBRATION CONTROL */}
            {pinterestPage === 5 && (
              <div className="text-center mt-6">
                <button
                  onClick={restartCelebrate}
                  className="rounded-full px-5 py-2 text-xs flex items-center space-x-2 mx-auto justify-center bg-white hover:bg-slate-50 border border-rose-100 text-rose-600 font-bold shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isInteractivePreview ? "Reset Interactive Preview" : "Play Surprises Again"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* MAIN CARDS CONTENT CONTAINER FOR STANDARD QUESTS */
          <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col justify-center min-h-screen relative z-20">
            
            {/* TITLE HEADER */}
            <div className="text-center mb-8">
              <span className="text-xs font-bold font-mono tracking-widest text-[#f43f5e] uppercase bg-rose-50 dark:bg-rose-950/40 py-1.5 px-4 rounded-full border border-rose-100 dark:border-rose-900/30">
                Happy Birthday, {state.recipientName}! {state.recipientAge ? `• Age ${state.recipientAge}` : ""}
              </span>
              <h2 className={`${themeStyle.heading} mt-3`}>
                Happy Birthday Wish {state.recipientAge ? `🎂` : "🎈"}
              </h2>
            </div>

            <div className="space-y-8">
              
              {/* CARD 1: EXTINGUISH THE CANDLES STAGE */}
              {(state.interactiveChallenge === "cake" || state.interactiveChallenge === "all") && (
                <div className={`${themeStyle.card} p-8 text-center`}>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-full text-rose-500 shadow-sm">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-2">The Birthday Cake </h3>
                  <p className={`${themeStyle.body} text-sm max-w-md mx-auto mb-6`}>
                    Let's start! Blow the candles or tap on them to make your birthday wish and unwrap your special letters!
                  </p>
                  {renderInteractiveCake()}
                </div>
              )}

              {/* BALLOON POP CHALLENGE BANNER */}
              {(state.interactiveChallenge === "balloons" || state.interactiveChallenge === "all") && (
                <div className={`${themeStyle.card} p-8 text-center relative overflow-hidden`}>
                  <h3 className="text-xl font-black mb-2 flex items-center justify-center space-x-2">
                    <span>🎈 Hovering Surprise Balloons</span>
                  </h3>
                  <p className={`${themeStyle.body} text-sm mb-4`}>
                    Pop the floating helium balloons drifting across your viewport to discover cute, personalized quotes and birthday wishes!
                  </p>
                  <div className="flex justify-center space-x-4">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 py-1 px-3.5 rounded-full border border-slate-200 dark:border-slate-700/50">
                      Remaining: {balloons.filter(b => !b.popped).length} Balloons
                    </span>
                  </div>
                </div>
              )}

              {/* CARD 2: REVEAL PERSONAL MESSAGE GIFTBOX */}
              <div className={`${themeStyle.card} p-8 text-center relative overflow-hidden`}>
                <AnimatePresence mode="wait">
                  {!giftDiscovered ? (
                    /* GIFT UNOPENED SCREEN */
                    <motion.div
                      key="closed"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="py-10"
                    >
                      <div className="flex justify-center mb-6">
                        <motion.div
                          animate={{
                            rotate: [-3, 3, -3],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.5,
                            ease: "easeInOut",
                          }}
                          onClick={openGiftBox}
                          className="cursor-pointer p-6 bg-gradient-to-br from-indigo-500 to-rose-500 border-4 border-slate-900 rounded-3xl text-white shadow-[0_10px_25px_rgba(99,102,241,0.3)] hover:brightness-110 active:scale-95 transition-all text-center relative"
                        >
                          <Gift className="w-20 h-20 fill-white/10" />
                          <div className="absolute -top-3 -right-3 bg-yellow-400 text-slate-900 font-extrabold text-xs py-1 px-2.5 rounded-full border-2 border-slate-900 animate-bounce">
                            TAP ME!
                          </div>
                        </motion.div>
                      </div>

                      <h4 className="text-lg font-black mb-1">A Sealed Gift Letter</h4>
                      <p className={`${themeStyle.body} text-xs max-w-sm mx-auto mb-4`}>
                        Click the magical virtual gift box above to open, unwrap, and reveal the heartfelt custom message inside!
                      </p>

                      {state.giftClue && (
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 max-w-sm mx-auto border border-dashed border-slate-200 dark:border-slate-850">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Mystery Clue</span>
                          <p className="text-xs italic text-slate-500 dark:text-slate-400">"{state.giftClue}"</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* GIFT REVEALED LETTER STAGE */
                    <motion.div
                      key="opened"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-left"
                    >
                      {/* The Unboxed Letter Frame */}
                      <div className="flex flex-col items-center mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800">
                        {renderAvatar()}
                        <h4 className="text-2xl font-black mt-4 tracking-tight">For {state.recipientName}</h4>
                        {state.relationship && (
                          <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 py-1 px-3.5 rounded-full font-bold mt-1.5 font-mono">
                            From: Your {state.relationship}
                          </span>
                        )}
                      </div>

                      {/* Letter Poem */}
                      {state.poem && (
                        <div className="bg-gradient-to-r from-rose-50/50 to-indigo-50/50 dark:from-rose-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-slate-250/20 dark:border-slate-800/40 mb-6 text-center shadow-inner relative">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 absolute top-2 left-1/2 transform -translate-x-1/2">
                            Special Rhyme
                          </span>
                          <p className="text-sm italic font-serif leading-loose whitespace-pre-line text-slate-800 dark:text-slate-200 mt-2">
                            {state.poem}
                          </p>
                        </div>
                      )}

                      {/* Letter Message Body */}
                      <div className={`${themeStyle.body} space-y-4 whitespace-pre-wrap text-md bg-white/20 dark:bg-slate-950/20 p-6 rounded-2xl border border-white/10`}>
                        {state.customMessage || "Wishing you an absolutely magical birthday! May this year ahead bless you with incredible happiness, vibrant health, compiler-clean code, and great fortunes. Let's celebrate to your heart's desire! 🎂✨"}
                      </div>

                      <div className="flex justify-center mt-6">
                        <div className="inline-flex items-center space-x-1.5 text-rose-500 font-extrabold text-xs">
                          <Heart className="w-4 h-4 fill-rose-500 animate-pulse" />
                          <span>Forever Wishing of You</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RETRY / RESET CELEBRATION CONTROL */}
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={restartCelebrate}
                className={`rounded-full px-5 py-2 text-xs flex items-center space-x-2 mx-auto justify-center border transition-all ${themeStyle.secondaryButton}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isInteractivePreview ? "Reset Interactive Preview" : "Play Surprises Again"}</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Hidden Audio element for custom background MP3 soundtrack files */}
      {state.uploadedMusic && (
        <audio
          ref={uploadedAudioRef}
          src={state.uploadedMusic}
          loop
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {/* FLOATING CUTE PINK MEDIA CONTROLLER */}
      {envelopeOpened && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs w-72 bg-white/95 dark:bg-rose-950/95 border-4 border-[#4c0519] rounded-2xl shadow-[4px_4px_0px_#4c0519] p-3 text-pink-950 dark:text-pink-100 flex flex-col space-y-1.5 font-sans select-none text-left">
          <div className="flex items-center space-x-3">
            {/* Play Pause button */}
            <button
              type="button"
              onClick={toggleAudio}
              className="w-8 h-8 p-0 bg-rose-400 hover:bg-rose-500 hover:scale-105 active:scale-95 text-white rounded-full cursor-pointer border-2 border-[#4c0519] transition-transform text-xs flex items-center justify-center shadow-xs text-center font-bold"
            >
              {audioPlaying ? "⏸" : "▶"}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest leading-none font-mono">background playing 🎵</p>
              <p className="text-xs font-serif italic font-semibold truncate leading-tight pt-0.5">
                {state.uploadedMusicName || state.pinterestSong || "cozy birthday soundtrack"}
              </p>
            </div>
          </div>

          {state.uploadedMusic && (
            <div className="space-y-1 font-mono">
              {/* Progress bar */}
              <div className="flex items-center space-x-1.5 text-[8px] text-slate-500">
                <span>{formatTime(audioCurrentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={audioDuration || 100}
                  value={audioCurrentTime}
                  onChange={(e) => {
                    const seekVal = parseFloat(e.target.value);
                    if (uploadedAudioRef.current) {
                      uploadedAudioRef.current.currentTime = seekVal;
                      setAudioCurrentTime(seekVal);
                    }
                  }}
                  className="flex-grow accent-rose-500 h-1 bg-rose-100 rounded-lg cursor-pointer appearance-none outline-none"
                />
                <span>{formatTime(audioDuration)}</span>
              </div>

              {/* Volume icon and slider */}
              <div className="flex items-center justify-end space-x-1">
                <span className="text-[9px]">🔊</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audioVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setAudioVolume(vol);
                    if (uploadedAudioRef.current) {
                      uploadedAudioRef.current.volume = vol;
                    }
                  }}
                  className="w-16 h-1 bg-rose-100 rounded-lg cursor-pointer appearance-none outline-none"
                  style={{ accentColor: "#ec4899" }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
