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

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sound generator parameters
  const theme = state.theme;

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
          secondaryButton: "bg-yellow-100 hover:bg-yellow-200 text-slate-900 font-extrabold border-4 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]",
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

  const themeStyle = getThemeClasses();

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

    const secretQuotes = [
      state.shortQuote || "You're dynamic!",
      "Happy Birthday!",
      "Have a blast! 🚀",
      "You make the world catalog sparkle!",
      "An absolute legend! 👑",
      "May all your coding compile on the first try! 💻",
      "Eat tons of cake! 🎂",
      "Sending you infinite cozy hugs! 🤗",
      "Another outstanding year older! 🎉",
    ];

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
  }, [envelopeOpened, state.shortQuote]);

  // Handle music toggle
  const toggleAudio = () => {
    if (audioPlaying) {
      synth.stopMusic();
      setAudioPlaying(false);
    } else {
      synth.startMusic(state.music);
      setAudioPlaying(true);
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
    synth.stopMusic();
    setAudioPlaying(false);
    setActiveQuoteToast(null);
    if (onResetPreview) {
      onResetPreview();
    }
  };

  const triggerOpenCard = () => {
    setEnvelopeOpened(true);
    // Start chosen music automatically!
    synth.startMusic(state.music);
    setAudioPlaying(state.music !== "none");
    
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

  return (
    <div className={themeStyle.bg}>
      {/* Background decorations depending on Theme */}
      {theme === "midnight" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-200 rounded-full animate-ping" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-amber-300 rounded-full animate-pulse delay-500" />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-1000" />
          <div className="absolute bottom-40 right-1/3 w-3.5 h-3.5 bg-yellow-100 rounded-full opacity-40 animate-ping delay-200" />
        </div>
      )}

      {theme === "space" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-pink-500/10 blur-3xl animate-pulse" />
          {/* Custom Stars */}
          <div className="absolute top-10 right-10 block text-indigo-400/40 text-xl">✨</div>
          <div className="absolute bottom-20 left-20 block text-pink-400/30 text-lg">⭐</div>
        </div>
      )}

      {/* Floating Sparkles for Disco */}
      {theme === "disco" && (
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
                  {/* Balloon string */}
                  <div className="w-0.5 h-16 bg-slate-900/10 absolute -bottom-16 left-1/2 transform -translate-x-1/2" />
                  {/* Floating particle sparkle inside balloon */}
                  <div className="w-1/3 h-1/3 bg-white/25 rounded-full absolute top-1.5 left-2" />
                  <span className="text-xs pointer-events-none drop-shadow">🎈</span>
                </motion.div>
              )
          )}
        </div>
      )}

      {/* MAIN CARDS CONTENT CONTAINER */}
      {envelopeOpened && (
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
              onClick={restartCelebrate}
              className={`rounded-full px-5 py-2 text-xs flex items-center space-x-2 mx-auto justify-center border transition-all ${themeStyle.secondaryButton}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isInteractivePreview ? "Reset Interactive Preview" : "Play Surprises Again"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
