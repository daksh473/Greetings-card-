import React, { useState, useEffect } from "react";
import { BirthdayCardState, SuggestionParams, BirthdayTheme, MusicChoice, InteractiveChallenge, CakeType } from "../types";
import { encodeCardState, AVATAR_OPTIONS } from "../utils/sharing";
import { Sparkles, Gift, Music, Copy, Share2, ExternalLink, RefreshCw, Check, AlertCircle, Heart, Star, Send, Trash2, Upload, Lock, Palette, Image as ImageIcon } from "lucide-react";
import BirthdayCardViewer from "./BirthdayCardViewer";

export default function BirthdayCardCreator() {
  // 1. Core Card State Form Values
  const [formState, setFormState] = useState<BirthdayCardState>({
    recipientName: "Daksh",
    recipientAge: "25",
    relationship: "Best Friend",
    theme: "pastel",
    music: "piano",
    interactiveChallenge: "all",
    avatarUrl: "kitty",
    customMessage: "Happy Birthday! Wishing you an absolute blast on your special day. May this year be filled with beautiful smiles, glorious compiles, endless coffees, and wonderful coding adventures!",
    poem: "To the absolute best friend in the town,\nYou make code work and never let me down!\nAnother year older, more wisdom to find,\nWishing you a birthday that is one of a kind!",
    giftClue: "An infinite bucket of hot coffee and warm developer hugs!",
    shortQuote: "To the coffee-fueled coding MVP!",
    cakeType: "strawberry",
    interests: "coffee, video games, cats",
    emotion: "cute",
    
    // Pinterest initial values matching Kawaii pastels
    isPinterestCard: true,
    pinterestMemories: "our late-night stargazing, that time we got lost finding that cute cafe, sharing cozy matcha lattes in the winter rain",
    pinterestFavouriteThings: "matcha milk tea, animal crossing, lavender hoodies, tiny fluffy kittens",
    pinterestSong: "love story - taylor swift",
    pinterestHeroBadge: "♡ a birthday surprise",
    pinterestHeroHeading: "a little something for you",
    pinterestHeroSubtitle: "happy birthday ♡",
    pinterestLetterTitle: "Happy Birthday",
    pinterestLetterParagraph: "happy birthday to my favourite human. thank you for bringing so much light and warm laughter into my life. i cherish every tiny moment we share together, from the quiet walks to the chaotic plans. you mean the absolute world to me.",
    pinterestSongCaption: "press play — i picked this song because it always, always reminds me of you.",
    pinterestMemory1: "the bright smiles we share whenever we meet up ♡",
    pinterestMemory2: "sipping cozy lattes and losing track of time talking about everything and nothing...",
    pinterestMemory3: "just really, truly thankful that i get to spend another beautiful year by your side",
    pinterestWishParagraph: "thank you for being you — for the infinite patience, the late-night heart-to-hearts, the silly inside jokes we can't explain, and for making my days so much brighter. i hope today surrounds you with the exact same sweet joy you spread.",
    pinterestFinalTitle: "happy birthday ♡",
    pinterestFinalLetter: "happy birthday once again. i hope this new chapter brings you so many cozy afternoons, sweet achievements, and gentle smiles. i'll always be here to support you, cheer for you, and celebrate all your happiest moments. have the most magical day ever!",
    passcode: "1234",
    pinterestOldPaperHeading: "golden memories & parchment notes",
    pinterestOldPaperContent: "like an ancient letter written under warm candlelight, some bonds are perfectly preserved across the turning seasons. thank you for being my constant anchor, the quiet warmth in a noisy world, and the partner in all my nostalgic memories. here's to another beautiful chapter together.",
    pinterestOldPaperFootnote: "written in ink, sealed with quiet stardust.",
    pinterestOldPaperPhoto: "",

    // Dear You default state
    isDearYou: false,
    dearYouFavoritePhoto: "",
    dearYouFavoriteQuote: "Completely and perfectly, incandescently happy.",
    dearYouMemoryCaption: "i love you",
    dearYouMem0: "",
    dearYouMem1: "",
    dearYouMem2: "",
    dearYouMem3: "",
    dearYouAge: 7,
    dearYouCakeWish: "Make a wish and blow out the candles! May all your sweet dreams come true. 🎂✨",
    dearYouHeadline: "Happy Birthday, My Love",
    dearYouHeadlinePhoto: "",
    dearYouNoteText: "Happy birthday to my favorite person. You are the most caring, loving, and supportive soul I know — grateful for every ordinary Tuesday and every big adventure with you.",
    dearYouNotePhoto: "",
    dearYouFinalMessage: "Here's to another trip around the sun, with me right beside you.",
    dearYouSenderName: "Sam",
    dearYouAccent: "#B33A2E"
  });

  // 2. AI Wizard Suggestion Parameters
  const [suggestionTone, setSuggestionTone] = useState<"emotional" | "funny" | "poetic" | "cute">("cute");
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // 3. Generated Share State
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [shortenedLink, setShortenedLink] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [useShortLink, setUseShortLink] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generateLinkError, setGenerateLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!generatedLink) {
      setShortenedLink(null);
      return;
    }

    const shortenUrl = async () => {
      setIsShortening(true);
      try {
        const res = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: generatedLink })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shortUrl) {
            setShortenedLink(data.shortUrl);
            setUseShortLink(true);
          }
        }
      } catch (err) {
        console.warn("Failed to shorten link:", err);
      } finally {
        setIsShortening(false);
      }
    };

    shortenUrl();
  }, [generatedLink]);

  // Handler to compress, square-crop, and resize uploaded image on the fly
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageUploadError("Please upload a valid image file (PNG/JPG).");
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // 120x120px delivers premium viewing clarity while staying extremely lightweight (~4-8KB)
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          try {
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.65);
            setFormState((prev) => ({
              ...prev,
              avatarUrl: compressedDataUrl,
            }));
          } catch (err) {
            console.error("Image compression error:", err);
            setImageUploadError("Failed to convert image. Please try a different photo.");
          }
        }
      };
      img.onerror = () => {
        setImageUploadError("Failed to load selected image.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reusable lightweight cropper/compressor for individual Dear You section photos
  const handleDearYouPhotoCompress = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof BirthdayCardState) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageUploadError("Please upload a valid image file (PNG/JPG).");
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const size = 240;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          try {
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.65);
            setFormState((prev) => ({
              ...prev,
              [fieldName]: compressedDataUrl,
            }));
          } catch (err) {
            console.error("Image compression error:", err);
            setImageUploadError("Failed to convert image. Please try a different photo.");
          }
        }
      };
      img.onerror = () => {
        setImageUploadError("Failed to load selected image.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handler to crop, compress and insert multiple album photos
  const handleMultiplePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploadError(null);
    const updatedPhotos = [...(formState.uploadedPhotos || [])];
    const maxPhotos = 5;

    // Process each file
    Array.from(files).slice(0, maxPhotos - updatedPhotos.length).forEach((file: any) => {
      if (!file.type.startsWith("image/")) {
        setImageUploadError("Please upload clear PNG or JPG image files only.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          // Width & height of 280 keeps the Base64 file extremely compact (~10KB) but neat on Polaroids
          const size = 280;
          canvas.width = size;
          canvas.height = size;
          
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            
            try {
              const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.60); // 60% quality
              setFormState((prev) => ({
                ...prev,
                uploadedPhotos: [...(prev.uploadedPhotos || []), compressedDataUrl],
              }));
            } catch (err) {
              console.error("Multi-photo processing error:", err);
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handler to upload and parse custom background photo or video
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      setImageUploadError("Please choose a valid background image (PNG/JPG) or video (MP4/WebM) file.");
      return;
    }

    setImageUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setFormState((prev) => ({
        ...prev,
        customBgType: isVideo ? "video" : "image",
        customBgUrl: base64Data,
        customBgOpacity: prev.customBgOpacity !== undefined ? prev.customBgOpacity : 45,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handler to upload and parse custom background soundtrack MP3 up to 1.5MB
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setImageUploadError("Please choose a valid MP3 or audio soundtrack file.");
      return;
    }

    // Safeguard for Firestore's 1MB limit - ideally keep it under 1.2MB for Base64 serialization
    if (file.size > 1.2 * 1024 * 1024) {
      setImageUploadError("Soundtrack file size exceeds 1.2MB. Please upload a smaller clip or use our synthesized tunes.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Audio = event.target?.result as string;
      setFormState((prev) => ({
        ...prev,
        uploadedMusic: base64Audio,
        uploadedMusicName: file.name.replace(/\.[^/.]+$/, ""), // remove extension
        music: "none" as any, // mute chiptunes/synth
      }));
    };
    reader.readAsDataURL(file);
  };


  // Loading quotes for funny AI progress spinner
  const loadingSteps = [
    "Sifting the galactic dictionaries of love...",
    "Brewing custom birthday rhyming stanzas...",
    "Baking the frosting layer parameters...",
    "Assembling cute customized balloon stickers...",
  ];

  // Triggers Gemini Suggest API route
  const handleAIGenerate = async () => {
    if (!formState.recipientName) {
      setAiError("Please fill in the Recipient's Name first!");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setLoadingStep(0);

    // Staggered funny spinner subtitles
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < 3 ? s + 1 : 0));
    }, 1800);

    try {
      const response = await fetch("/api/suggest-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.recipientName,
          age: formState.recipientAge,
          relationship: formState.relationship,
          interests: formState.interests,
          tone: suggestionTone,
          isPinterest: formState.isPinterestCard,
          memories: formState.pinterestMemories,
          favouriteThings: formState.pinterestFavouriteThings,
          song: formState.pinterestSong,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI content");
      }

      const data = await response.json();

      setFormState((prev) => ({
        ...prev,
        customMessage: data.wish || prev.customMessage,
        poem: data.poem || prev.poem,
        giftClue: data.giftClue || prev.giftClue,
        shortQuote: data.shortQuote || prev.shortQuote,
        emotion: suggestionTone,
        
        // Map Pinterest fields if they exist
        pinterestHeroBadge: data.pinterestHeroBadge || prev.pinterestHeroBadge,
        pinterestHeroHeading: data.pinterestHeroHeading || prev.pinterestHeroHeading,
        pinterestHeroSubtitle: data.pinterestHeroSubtitle || prev.pinterestHeroSubtitle,
        pinterestLetterTitle: data.pinterestLetterTitle || prev.pinterestLetterTitle,
        pinterestLetterParagraph: data.pinterestLetterParagraph || prev.pinterestLetterParagraph,
        pinterestSongCaption: data.pinterestSongCaption || prev.pinterestSongCaption,
        pinterestMemory1: data.pinterestMemory1 || prev.pinterestMemory1,
        pinterestMemory2: data.pinterestMemory2 || prev.pinterestMemory2,
        pinterestMemory3: data.pinterestMemory3 || prev.pinterestMemory3,
        pinterestWishParagraph: data.pinterestWishParagraph || prev.pinterestWishParagraph,
        pinterestFinalTitle: data.pinterestFinalTitle || prev.pinterestFinalTitle,
        pinterestFinalLetter: data.pinterestFinalLetter || prev.pinterestFinalLetter,
      }));

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "An unexpected error occurred while communicating with Gemini.");
    } finally {
      clearInterval(interval);
      setAiLoading(false);
    }
  };

  // Helper to generate a random 6-character short code for client-side Firestore
  const generateClientShortId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  // Triggers final shareable link construction via serverless database shortening
  const handleGenerateLink = async () => {
    if (!formState.recipientName) {
      setGenerateLinkError("Please provide a Recipient Name before creating your card!");
      return;
    }

    setIsGeneratingLink(true);
    setGenerateLinkError(null);
    setGeneratedLink(null);

    try {
      // 1. Primary path: Attempt high-performance Direct client-side Firestore storage (Fully compatible with Vercel)
      const { doc, setDoc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");

      let shortId = "";
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 5) {
        shortId = generateClientShortId();
        const docRef = doc(db, "cards", shortId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error("Failed to generate a unique short code. Please try again.");
      }

      const finalDocRef = doc(db, "cards", shortId);
      await setDoc(finalDocRef, formState);

      const absoluteUrl = `${window.location.origin}/?c=${shortId}`;
      setGeneratedLink(absoluteUrl);
    } catch (firebaseErr: any) {
      console.warn("Client-side Firestore write failed, trying fallback to Node Express server...", firebaseErr);
      
      try {
        // 2. Secondary path: Fallback backend Express custom database server (for local developer server)
        const response = await fetch("/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formState),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || "Backend database storage failed");
        }

        const data = await response.json();
        if (data && data.id) {
          // Form extremely elegant, direct shorter URL link
          const absoluteUrl = `${window.location.origin}/?c=${data.id}`;
          setGeneratedLink(absoluteUrl);
        } else {
          throw new Error("Invalid id payload received from card server");
        }
      } catch (err: any) {
        console.warn("Backend shortener failed, falling back to full offline URL parameters", err);
        // 3. Last resort fallback: Standard offline Base64 encoding parameters (safe & requires no network)
        const encodedStr = encodeCardState(formState);
        if (encodedStr) {
          const absoluteUrl = `${window.location.origin}/?card=${encodedStr}`;
          setGeneratedLink(absoluteUrl);
        } else {
          setGenerateLinkError("Could not build interactive gift link. Please check recipient parameters details.");
        }
      }
    } finally {
      setIsGeneratingLink(false);
      setCopied(false);
    }
  };

  const copyToClipboard = () => {
    const linkToCopy = (useShortLink && shortenedLink) ? shortenedLink : generatedLink;
    if (!linkToCopy) return;
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    const linkToShare = (useShortLink && shortenedLink) ? shortenedLink : generatedLink;
    if (!linkToShare) return;
    const text = `🎉 I have created a personalized interactive birthday greeting card for you! Click here to open: ${linkToShare}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleResetForm = () => {
    setFormState({
      recipientName: "",
      recipientAge: "",
      relationship: "Friend",
      theme: "pastel",
      music: "piano",
      interactiveChallenge: "all",
      avatarUrl: "kitty",
      customMessage: "",
      poem: "",
      giftClue: "",
      shortQuote: "",
      cakeType: "strawberry",
      interests: "",
    });
    setGeneratedLink(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      
      {/* HEADER BANNER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 rounded-2xl text-white shadow-md animate-spin-slow">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Interactive Birthday Card Generator
                <span className="text-[10px] bg-rose-100 text-rose-600 font-bold py-0.5 px-2 rounded-full uppercase">VIP Builder</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Draft beautiful animated surprises, add synthesized music, and generate instant WhatsApp share links!
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleResetForm}
              className="px-4 py-2 text-xs border border-slate-300 rounded-xl hover:bg-slate-100 text-slate-600 font-medium cursor-pointer"
            >
              Start Empty Card
            </button>
            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs text-white bg-slate-900 rounded-xl font-bold flex items-center space-x-1.5 shadow"
            >
              <span>AI Studio Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* BODY SECTIONS GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CUSTOMIZER FORM (Lg: 7 cells) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* SEC 1: TARGET CHARACTER DETAILS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-250/60 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-extrabold pb-3 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-sm bg-indigo-50 text-indigo-500 py-1 px-2 rounded">01</span>
              <h2 className="text-sm uppercase tracking-wider">Recipient Profile</h2>
            </div>

            {/* CARD TYPE SELECTION BAR */}
            <div className="bg-gradient-to-r from-rose-50/80 to-purple-50/80 dark:from-rose-950/20 dark:to-fuchsia-950/20 p-4 rounded-2xl border border-rose-200/40 dark:border-rose-900/30 space-y-3">
              <label className="block text-xs font-black text-rose-500 dark:text-rose-450 uppercase tracking-widest text-center">
                🌸 Select Card Layout Vibe 🌸
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, isPinterestCard: true, isDearYou: false, theme: "pastel", emotion: "cute" })}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold font-sans tracking-wide border cursor-pointer text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    formState.isPinterestCard && !formState.isDearYou
                      ? "bg-rose-400 border-rose-300 text-white shadow-sm scale-[1.01]"
                      : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[11px] font-mono">🌸 PASTEL PINTEREST</span>
                  <span className="text-[8px] font-medium opacity-90">Cute 5-Step Storybook</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, isPinterestCard: false, isDearYou: false })}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold font-sans tracking-wide border cursor-pointer text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    !formState.isPinterestCard && !formState.isDearYou
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm scale-[1.01]"
                      : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[11px] font-mono">🎈 CLASSIC SURPRISE</span>
                  <span className="text-[8px] font-medium opacity-90">Candle Cake & Giftbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, isPinterestCard: false, isDearYou: true })}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold font-sans tracking-wide border cursor-pointer text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    formState.isDearYou
                      ? "bg-amber-600 border-amber-500 text-white shadow-sm scale-[1.01]"
                      : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[11px] font-mono">💌 DEAR YOU</span>
                  <span className="text-[8px] font-medium opacity-90">Cozy 8-Step Scrapbook</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-light leading-relaxed">
                {formState.isDearYou
                  ? "An elegant, retro scrapbook card with passcode lock, animated envelopes, a custom candle-blowing cake, 4 memory photos, a hand-written letter, and beautiful color accents!"
                  : formState.isPinterestCard
                  ? "Bake cupcakes, pop customizable balloons, play sweet chiptunes, and flip through a gorgeous lavender polaroid album with personalized song titles!"
                  : "A gamified quest with micro-interactions: blow out the candles, unwrap a sealed box, and discover a custom gift clue & poem."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Recipient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joy, Daksh, Sister"
                  value={formState.recipientName}
                  onChange={(e) => setFormState({ ...formState, recipientName: e.target.value })}
                  className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Age (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 25, 30th, Sweet 16"
                  value={formState.recipientAge}
                  onChange={(e) => setFormState({ ...formState, recipientAge: e.target.value })}
                  className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Their Relationship *</label>
                <select
                  value={formState.relationship}
                  onChange={(e) => setFormState({ ...formState, relationship: e.target.value })}
                  className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-indigo-500"
                >
                  <option value="Best Friend">Best Friend</option>
                  <option value="Friend">Friend</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Partner">Partner</option>
                  <option value="Mom">Mom</option>
                  <option value="Dad">Dad</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Child">Child</option>
                  <option value="Pet Dog">Pet Dog</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Interests / Hobbies</label>
                <input
                  type="text"
                  placeholder="e.g. coffee, video games, cats"
                  value={formState.interests}
                  onChange={(e) => setFormState({ ...formState, interests: e.target.value })}
                  className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* SECURITY GATE SETTING */}
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-3.5 rounded-2xl space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1.5 uppercase tracking-wide font-mono flex items-center gap-1.5">
                  🔐 4-Digit Security Passcode
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 1234 (Default: 1234)"
                  value={formState.passcode || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setFormState({ ...formState, passcode: val });
                  }}
                  className="w-full md:w-64 border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-sm font-mono tracking-widest focus:ring-2 focus:ring-rose-500 outline-none"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  If provided, the recipient must enter this 4-digit code on an aesthetic keypad gate to unlock their digital scrapbook greeting card!
                </p>
              </div>

              {/* Lock Screen Wallpaper Customizer inside Creator */}
              <div className="pt-3 border-t border-rose-100 dark:border-rose-900/30 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                  <span>Lock Screen Background URL</span>
                </label>
                <input
                  type="text"
                  placeholder="Paste direct image link (or leave blank for solid black)..."
                  value={formState.passcodeBgUrl === "solid-black" ? "" : (formState.passcodeBgUrl || "")}
                  onChange={(e) => setFormState({ ...formState, passcodeBgUrl: e.target.value.trim() || "solid-black" })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400"
                />
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, passcodeBgUrl: "solid-black" })}
                    className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                      (formState.passcodeBgUrl || "solid-black") === "solid-black" 
                        ? "bg-rose-500 text-white border-transparent font-semibold" 
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    Velvet Black
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, passcodeBgUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1200" })}
                    className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                      formState.passcodeBgUrl?.includes("photo-1506318137071") 
                        ? "bg-rose-500 text-white border-transparent font-semibold" 
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    Starry Night
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, passcodeBgUrl: "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&q=80&w=1200" })}
                    className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                      formState.passcodeBgUrl?.includes("photo-15790334613") 
                        ? "bg-rose-500 text-white border-transparent font-semibold" 
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    Midnight Aurora
                  </button>
                </div>
              </div>

              {/* Lock Screen Text Color Customizer inside Creator */}
              <div className="pt-3 border-t border-rose-100 dark:border-rose-900/30 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Lock Screen Text Color</span>
                </label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 flex-shrink-0"
                    style={{ backgroundColor: formState.passcodeTextColor || "#ffffff" }}
                  />
                  <input
                    type="text"
                    placeholder="#ffffff"
                    value={formState.passcodeTextColor || "#ffffff"}
                    onChange={(e) => setFormState({ ...formState, passcodeTextColor: e.target.value })}
                    className="flex-grow border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white font-mono placeholder-slate-400 focus:outline-rose-500"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { name: "White", value: "#ffffff" },
                    { name: "Pink", value: "#f472b6" },
                    { name: "Gold", value: "#fbbf24" },
                    { name: "Cyan", value: "#22d3ee" },
                    { name: "Mint", value: "#34d399" },
                    { name: "Lavender", value: "#c084fc" },
                  ].map((tc) => (
                    <button
                      key={tc.name}
                      type="button"
                      onClick={() => setFormState({ ...formState, passcodeTextColor: tc.value })}
                      className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${
                        (formState.passcodeTextColor || "#ffffff").toLowerCase() === tc.value.toLowerCase()
                          ? "bg-rose-500 text-white border-transparent font-semibold" 
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {tc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AVATAR CHOOSER */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Recipient Cute Avatar</label>
              
              {/* Preset Emojis */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {AVATAR_OPTIONS.map((a) => {
                  const isSelected = formState.avatarUrl === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      title={a.name}
                      onClick={() => {
                        setImageUploadError(null);
                        setFormState({ ...formState, avatarUrl: a.id });
                      }}
                      className={`p-3 rounded-2xl border text-2xl text-center cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-900 border-indigo-500 scale-105 shadow-md text-white"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{a.emoji}</span>
                    </button>
                  );
                })}
              </div>

              {/* Upload Image Section */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider">Photo & Custom Media</span>
                  {formState.avatarUrl.startsWith("data:") && (
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, avatarUrl: "kitty" })}
                      className="text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Uploaded</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Avatar Preview */}
                  <div className="w-16 h-16 rounded-2xl border-2 border-indigo-500 overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {formState.avatarUrl.startsWith("data:") ? (
                      <img
                        src={formState.avatarUrl}
                        alt="Uploaded Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : formState.avatarUrl.includes("http") ? (
                      <img
                        src={formState.avatarUrl}
                        alt="Custom Link"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-3xl">
                        {AVATAR_OPTIONS.find((a) => a.id === formState.avatarUrl)?.emoji || "🐱"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="relative flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-white dark:bg-slate-905 transition-colors">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload custom photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 font-light">
                      JPG/PNG supported. Automatically optimized to center square for direct sharing link.
                    </p>
                  </div>
                </div>

                {imageUploadError && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{imageUploadError}</span>
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Or Paste Custom Image Link URL Instead</label>
                  <input
                    type="url"
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    value={formState.avatarUrl.includes("http") && !formState.avatarUrl.startsWith("data:") ? formState.avatarUrl : ""}
                    onChange={(e) => setFormState({ ...formState, avatarUrl: e.target.value || "kitty" })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-slate-850 dark:text-slate-100 text-xs focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEC 2: GEMINI AI MAGIC WISH SYNTHESIZER */}
          <div className="bg-gradient-to-r from-indigo-900/5 via-purple-900/5 to-pink-950/5 dark:bg-gradient-to-br dark:from-indigo-950/20 dark:to-orange-950/10 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-indigo-200/40 dark:border-indigo-900/40">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-extrabold">
                <span className="text-sm bg-indigo-100 text-indigo-600 py-1 px-2 rounded">02</span>
                <h2 className="text-sm uppercase tracking-wider flex items-center space-x-1">
                  <span>Gemini Wish Assistant</span>
                  <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
                </h2>
              </div>
              <span className="text-[9px] bg-indigo-200 text-indigo-800 font-black py-0.5 px-1.5 rounded">AUTO-GEN</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Craft heart-melting and exceptionally clever wishes! Gemini will write personalized lyrics, a rhyming stanza poem, a secret gift clue, and popping balloon sub-quotes suited perfectly for their profile details!
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Choose AI Message Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "funny", label: "Witty Roast" },
                    { id: "emotional", label: "Emotional" },
                    { id: "poetic", label: "Poetic" },
                    { id: "cute", label: "Cute" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSuggestionTone(t.id as any)}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center border cursor-pointer uppercase tracking-wider transition-all ${
                        suggestionTone === t.id
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-black py-3 px-4 rounded-xl border border-slate-850 cursor-pointer flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs tracking-wide">{loadingSteps[loadingStep]}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>SYNTHESIZE WARM WISHES WITH AI</span>
                  </>
                )}
              </button>

              {aiError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-600 rounded-xl p-3 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>
          </div>

          {/* SEC 3: GREETING WISH CUSTOMIZER PREVIEW (MANUAL SLIDERS) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-250/60 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-extrabold pb-3 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-sm bg-rose-50 text-rose-500 py-1 px-2 rounded">03</span>
              <h2 className="text-sm uppercase tracking-wider">
                {formState.isDearYou ? "Review 'Dear You' 7-Step Content" : formState.isPinterestCard ? "Review Pinterest 6-Page Content" : "Review Card Letter Content"}
              </h2>
            </div>

            <div className="space-y-4">
              {formState.isDearYou ? (
                /* DEAR YOU INTERACTIVE SCRAPBOOK FIELDS */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/40 dark:bg-amber-955/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-4">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-widest font-sans block">💌 Dear You Customizer (7-Step Scrapbook)</span>
                    
                    {/* Step 1: Passcode */}
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">🔐 Passcode Lock (4 Digits)</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 1206"
                        value={formState.passcode || ""}
                        onChange={(e) => setFormState({ ...formState, passcode: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs font-mono tracking-widest text-slate-800 dark:text-white"
                      />
                      <p className="text-[9px] text-slate-500">A special date or number they'll guess with a smile.</p>
                    </div>

                    {/* Step 2: Favorite Person */}
                    <div className="space-y-2 pt-3 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">🥰 Favorite Person Page</label>
                      
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">Short Line About Them</span>
                        <input
                          type="text"
                          value={formState.dearYouFavoriteQuote || ""}
                          onChange={(e) => setFormState({ ...formState, dearYouFavoriteQuote: e.target.value })}
                          className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">Favorite Person Photo</span>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/10 rounded-xl cursor-pointer transition-colors text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleDearYouPhotoCompress(e, "dearYouFavoritePhoto")}
                              className="hidden"
                            />
                          </label>
                          {formState.dearYouFavoritePhoto && (
                            <img src={formState.dearYouFavoritePhoto} className="w-10 h-10 object-cover rounded-lg border border-amber-200" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Memories */}
                    <div className="space-y-3 pt-3 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">📸 Our Memories Page</label>
                      
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">Caption (e.g. "i love you")</span>
                        <input
                          type="text"
                          value={formState.dearYouMemoryCaption || ""}
                          onChange={(e) => setFormState({ ...formState, dearYouMemoryCaption: e.target.value })}
                          className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[10px] text-slate-500 font-medium">Four Photos (Polaroid Grid)</span>
                        <div className="grid grid-cols-4 gap-2">
                          {(["dearYouMem0", "dearYouMem1", "dearYouMem2", "dearYouMem3"] as const).map((memKey, idx) => (
                            <div key={memKey} className="relative aspect-square bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                              {formState[memKey] ? (
                                <>
                                  <img src={formState[memKey]} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setFormState({ ...formState, [memKey]: "" })}
                                    className="absolute top-0.5 right-0.5 bg-rose-500 text-white rounded-full p-0.5 text-[8px] leading-none"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50/10">
                                  <span className="text-slate-400 text-[10px] font-bold">#{idx + 1}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleDearYouPhotoCompress(e, memKey)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Make a Wish */}
                    <div className="space-y-1.5 pt-3 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">🎂 Make A Wish Page</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Number of Candles:</span>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={formState.dearYouAge || 7}
                          onChange={(e) => setFormState({ ...formState, dearYouAge: Math.max(1, Math.min(12, parseInt(e.target.value) || 1)) })}
                          className="w-20 border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-1 rounded-lg text-xs text-center text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1 mt-2">
                        <span className="block text-[10px] text-slate-500 font-medium">Cake Wish Caption</span>
                        <textarea
                          rows={2}
                          value={formState.dearYouCakeWish || ""}
                          onChange={(e) => setFormState({ ...formState, dearYouCakeWish: e.target.value })}
                          placeholder="Make a wish and blow out the candles! May all your sweet dreams come true."
                          className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                      <p className="text-[9px] text-slate-500">They will tap the cake in interactive view to blow out these candles!</p>
                    </div>

                    {/* Step 5: Big Reveal */}
                    <div className="space-y-2 pt-3 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">✨ The Big Reveal Page</label>
                      
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">Headline Title</span>
                        <input
                          type="text"
                          value={formState.dearYouHeadline || ""}
                          onChange={(e) => setFormState({ ...formState, dearYouHeadline: e.target.value })}
                          className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">Reveal Banner Photo</span>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/10 rounded-xl cursor-pointer transition-colors text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleDearYouPhotoCompress(e, "dearYouHeadlinePhoto")}
                              className="hidden"
                            />
                          </label>
                          {formState.dearYouHeadlinePhoto && (
                            <img src={formState.dearYouHeadlinePhoto} className="w-10 h-10 object-cover rounded-lg border border-amber-200" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 6: Vintage Parchment Old Paper */}
                    <div className="space-y-2 pt-3 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">📜 Step 6: Vintage Parchment Paper</label>
                      <div className="bg-amber-50/10 p-3 rounded-lg border border-amber-100/35 dark:border-slate-800 space-y-2">
                        <label className="block text-[9px] font-medium text-slate-400">Parchment Heading</label>
                        <input
                          type="text"
                          value={formState.pinterestOldPaperHeading || ""}
                          onChange={(e) => setFormState({ ...formState, pinterestOldPaperHeading: e.target.value })}
                          className="w-full border border-slate-205 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] mb-2 text-slate-800 dark:text-white font-serif"
                        />
                        <label className="block text-[9px] font-medium text-slate-400">Parchment Letter Content</label>
                        <textarea
                          rows={4}
                          value={formState.pinterestOldPaperContent || ""}
                          onChange={(e) => setFormState({ ...formState, pinterestOldPaperContent: e.target.value })}
                          className="w-full border border-slate-205 bg-white dark:bg-slate-950 p-2 rounded text-[11px] leading-relaxed text-slate-800 dark:text-white font-serif"
                        />
                        <label className="block text-[9px] font-medium text-slate-400 mt-1.5">Parchment Footnote / Sign-off</label>
                        <input
                          type="text"
                          value={formState.pinterestOldPaperFootnote || ""}
                          onChange={(e) => setFormState({ ...formState, pinterestOldPaperFootnote: e.target.value })}
                          className="w-full border border-slate-205 bg-white dark:bg-slate-950 p-1.5 rounded text-[10px] italic text-slate-800 dark:text-white font-serif"
                        />
                      </div>
                    </div>

                    {/* Step 7: Sign Off */}
                    <div className="space-y-2.5 pt-3 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">🖋️ Step 7: Sign Off & Color</label>
                      
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">Closing Line</span>
                        <input
                          type="text"
                          value={formState.dearYouFinalMessage || ""}
                          onChange={(e) => setFormState({ ...formState, dearYouFinalMessage: e.target.value })}
                          className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-500 font-medium">From Name</span>
                          <input
                            type="text"
                            value={formState.dearYouSenderName || ""}
                            onChange={(e) => setFormState({ ...formState, dearYouSenderName: e.target.value })}
                            className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-xl text-xs text-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <span className="block text-[10px] text-slate-500 font-medium">Card Color Theme</span>
                          <div className="flex items-center gap-1 mt-1.5">
                            {['#B33A2E', '#7A4FA3', '#2E7D6B', '#B3762E', '#4A5FB3', '#B33A7A'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setFormState({ ...formState, dearYouAccent: c })}
                                style={{ backgroundColor: c }}
                                className={`w-5 h-5 rounded-full border border-white cursor-pointer transition-transform ${
                                  formState.dearYouAccent === c ? "scale-125 ring-2 ring-amber-400" : ""
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Custom Soundtrack MP3 Upload (Dear You) */}
                      <div className="pt-2.5 border-t border-dashed border-amber-100 dark:border-amber-900/20">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Custom Soundtrack MP3 (Max 1.2MB)</label>
                        <p className="text-[8px] text-slate-400 mb-1.5 leading-relaxed">
                          Provide an MP3 audio file to override the default background music for your scrapbook story.
                        </p>

                        {formState.uploadedMusic ? (
                          <div className="bg-amber-50/50 dark:bg-slate-950/30 rounded-lg p-2 border border-amber-100 dark:border-amber-900/20 flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-xs">🎵</span>
                              <div className="truncate text-left">
                                <span className="text-[10px] font-black text-amber-900 dark:text-amber-100 block truncate">{formState.uploadedMusicName || "uploaded-music"}</span>
                                <span className="text-[8px] text-amber-500 capitalize">soundtrack ready!</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormState({
                                  ...formState,
                                  uploadedMusic: undefined,
                                  uploadedMusicName: undefined,
                                  music: "piano"
                                });
                              }}
                              className="text-[9px] text-red-500 hover:text-red-700 font-extrabold cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 px-1.5 py-0.5 rounded border-0 bg-transparent"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-amber-300 hover:border-amber-500 bg-white dark:bg-slate-950 hover:bg-amber-50/20 rounded-lg cursor-pointer transition-all">
                            <Music className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-600">Upload background MP3 audio</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleMusicUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              ) : formState.isPinterestCard ? (
                /* PINTEREST INTERACTIVE MULTI-PAGES FIELDS */
                <div className="space-y-4">
                  {/* Primary Inputs first */}
                  <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-150/50 dark:border-rose-900/30 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider font-sans">Primary Pinterest Inputs</span>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Our Special Memories (for Album Page) *</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. our stargazing nights, getting lost in Tokyo, coffee chats..."
                        value={formState.pinterestMemories}
                        onChange={(e) => setFormState({ ...formState, pinterestMemories: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-lg text-slate-808 dark:text-white text-xs focus:outline-rose-405"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Their Favourite Things *</label>
                        <input
                          type="text"
                          placeholder="e.g. matcha latte, cat, blankets"
                          value={formState.pinterestFavouriteThings}
                          onChange={(e) => setFormState({ ...formState, pinterestFavouriteThings: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-lg text-slate-808 dark:text-white text-xs focus:outline-rose-405"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Background Song Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. lover - taylor swift"
                          value={formState.pinterestSong}
                          onChange={(e) => setFormState({ ...formState, pinterestSong: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded-lg text-slate-808 dark:text-white text-xs focus:outline-rose-405"
                        />
                      </div>
                    </div>

                    {/* Dynamic Custom Photos and Sound Files */}
                    <div className="pt-2 border-t border-dashed border-rose-100 dark:border-rose-900/20 space-y-3">
                      <span className="text-[10px] uppercase font-bold text-[#f43f5e] tracking-wider font-sans block">Upload Custom Media (Optional)</span>
                      
                      {/* Album Photo Uploads */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Photos for 'Our Little Album' (Up to 5) ♡</label>
                        <div className="grid grid-cols-5 gap-2 mb-2">
                          {/* Render existing photos */}
                          {(formState.uploadedPhotos || []).map((photoSrc, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-rose-300 shadow-xs group bg-white">
                              <img src={photoSrc} alt={`Captured ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPhotos = (formState.uploadedPhotos || []).filter((_, i) => i !== idx);
                                  setFormState({ ...formState, uploadedPhotos: newPhotos });
                                }}
                                className="absolute top-0.5 right-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 text-[8px] cursor-pointer shadow-xs transition-transform active:scale-90"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {/* Placeholders if photos < 5 */}
                          {Array.from({ length: Math.max(0, 5 - (formState.uploadedPhotos || []).length) }).map((_, i) => (
                            <div key={i} className="aspect-square bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-300">
                              none ♡
                            </div>
                          ))}
                        </div>

                        <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-[#f43f5e]/40 hover:border-[#f43f5e] bg-white hover:bg-rose-50/40 rounded-lg cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5 text-[#f43f5e]" />
                          <span className="text-[10px] font-bold text-[#f43f5e]">Add custom memory photo(s)</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleMultiplePhotosUpload}
                            className="hidden"
                            id="pinterest-photos-input"
                          />
                        </label>
                      </div>

                      {/* Background Music Soundtrack Upload */}
                      <div className="pt-2 border-t border-dashed border-rose-100 dark:border-rose-900/10">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Custom Soundtrack MP3 (Max 1.2MB)</label>
                        <p className="text-[8px] text-slate-400 mb-1.5 leading-relaxed">
                          Provide an MP3 audio file to override the default synthesized background tune.
                        </p>

                        {formState.uploadedMusic ? (
                          <div className="bg-rose-50/80 rounded-lg p-2 border border-rose-150 flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="text-xs">🎵</span>
                              <div className="truncate">
                                <span className="text-[10px] font-black text-rose-700 block truncate">{formState.uploadedMusicName || "uploaded-music"}</span>
                                <span className="text-[8px] text-rose-400 capitalize">soundtrack ready!</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormState({
                                  ...formState,
                                  uploadedMusic: undefined,
                                  uploadedMusicName: undefined,
                                  music: "piano"
                                });
                              }}
                              className="text-[9px] text-rose-500 hover:text-rose-700 font-extrabold cursor-pointer hover:bg-rose-100 px-1.5 py-0.5 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/20 rounded-lg cursor-pointer transition-all">
                            <Music className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-[10px] font-bold text-purple-600">Upload background MP3 audio</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleMusicUpload}
                              className="hidden"
                              id="pinterest-soundtrack-input"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5-Step Story Board Pages */}
                  <div className="space-y-4 border-l-2 border-dashed border-rose-200 dark:border-rose-900/40 pl-3">
                    {/* PAGE 1: HERO */}
                    <div className="bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 dark:border-slate-850 space-y-2">
                      <span className="text-[10px] font-bold text-rose-400 font-mono">STEP 1: HERO SCREEN</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-400">Badge Text</label>
                          <input
                            type="text"
                            value={formState.pinterestHeroBadge}
                            onChange={(e) => setFormState({ ...formState, pinterestHeroBadge: e.target.value })}
                            className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-400">Heading</label>
                          <input
                            type="text"
                            value={formState.pinterestHeroHeading}
                            onChange={(e) => setFormState({ ...formState, pinterestHeroHeading: e.target.value })}
                            className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-400">Subtitle</label>
                          <input
                            type="text"
                            value={formState.pinterestHeroSubtitle}
                            onChange={(e) => setFormState({ ...formState, pinterestHeroSubtitle: e.target.value })}
                            className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PAGE 2: OPEN LETTER */}
                    <div className="bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 dark:border-slate-850 space-y-2">
                      <span className="text-[10px] font-bold text-rose-400 font-mono">STEP 2: ENVELOPE / OPEN LETTER</span>
                      <div>
                        <label className="block text-[9px] font-medium text-slate-400">Heading Title</label>
                        <input
                          type="text"
                          value={formState.pinterestLetterTitle}
                          onChange={(e) => setFormState({ ...formState, pinterestLetterTitle: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] mb-2 text-slate-800 dark:text-white"
                        />
                        <label className="block text-[9px] font-medium text-slate-400">Heartfelt Paragraph (40-65 words)</label>
                        <textarea
                          rows={3}
                          value={formState.pinterestLetterParagraph}
                          onChange={(e) => setFormState({ ...formState, pinterestLetterParagraph: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-2 rounded text-[11px] leading-relaxed text-slate-800 dark:text-white"
                        />
                        <label className="block text-[9px] font-medium text-slate-400 mt-1.5">Song Caption Note</label>
                        <input
                          type="text"
                          value={formState.pinterestSongCaption}
                          onChange={(e) => setFormState({ ...formState, pinterestSongCaption: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[10px] italic text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* PAGE 3: ALBUM */}
                    <div className="bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 dark:border-slate-850 space-y-2">
                      <span className="text-[10px] font-bold text-rose-400 font-mono">STEP 3: OUR LITTLE POLAROID ALBUM</span>
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-400">Polaroid Caption 1</label>
                          <input
                            type="text"
                            value={formState.pinterestMemory1}
                            onChange={(e) => setFormState({ ...formState, pinterestMemory1: e.target.value })}
                            className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-400">Polaroid Caption 2</label>
                          <input
                            type="text"
                            value={formState.pinterestMemory2}
                            onChange={(e) => setFormState({ ...formState, pinterestMemory2: e.target.value })}
                            className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-400">Polaroid Caption 3</label>
                          <input
                            type="text"
                            value={formState.pinterestMemory3}
                            onChange={(e) => setFormState({ ...formState, pinterestMemory3: e.target.value })}
                            className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PAGE 4: WISH */}
                    <div className="bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 dark:border-slate-850 space-y-2">
                      <span className="text-[10px] font-bold text-rose-400 font-mono">STEP 4: SWEET WISH PAGE</span>
                      <div>
                        <label className="block text-[9px] font-medium text-slate-400">Wish Text (~50 words)</label>
                        <textarea
                          rows={3}
                          value={formState.pinterestWishParagraph}
                          onChange={(e) => setFormState({ ...formState, pinterestWishParagraph: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-2 rounded text-[11px] leading-relaxed text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* PAGE 5: FINAL LETTER */}
                    <div className="bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 dark:border-slate-850 space-y-2">
                      <span className="text-[10px] font-bold text-rose-400 font-mono">STEP 5: FINAL MEMORY CARD</span>
                      <div>
                        <label className="block text-[9px] font-medium text-slate-400">Final Card Title</label>
                        <input
                          type="text"
                          value={formState.pinterestFinalTitle}
                          onChange={(e) => setFormState({ ...formState, pinterestFinalTitle: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] mb-2 text-slate-800 dark:text-white"
                        />
                        <label className="block text-[9px] font-medium text-slate-400">Final Heartfelt Letter (~120 words)</label>
                        <textarea
                          rows={4}
                          value={formState.pinterestFinalLetter}
                          onChange={(e) => setFormState({ ...formState, pinterestFinalLetter: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-2 rounded text-[11px] leading-relaxed text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* PAGE 6: VINTAGE PARCHMENT OLD PAPER */}
                    <div className="bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 dark:border-slate-850 space-y-2">
                      <span className="text-[10px] font-bold text-amber-500 font-mono flex items-center gap-1">📜 STEP 6: VINTAGE PARCHMENT PAPER</span>
                      <div>
                        <label className="block text-[9px] font-medium text-slate-400">Parchment Heading</label>
                        <input
                          type="text"
                          value={formState.pinterestOldPaperHeading || ""}
                          onChange={(e) => setFormState({ ...formState, pinterestOldPaperHeading: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[11px] mb-2 text-slate-800 dark:text-white"
                        />
                        <label className="block text-[9px] font-medium text-slate-400">Parchment Letter Content</label>
                        <textarea
                          rows={4}
                          value={formState.pinterestOldPaperContent || ""}
                          onChange={(e) => setFormState({ ...formState, pinterestOldPaperContent: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-2 rounded text-[11px] leading-relaxed text-slate-800 dark:text-white"
                        />
                        <label className="block text-[9px] font-medium text-slate-400 mt-1.5">Parchment Footnote / Sign-off</label>
                        <input
                          type="text"
                          value={formState.pinterestOldPaperFootnote || ""}
                          onChange={(e) => setFormState({ ...formState, pinterestOldPaperFootnote: e.target.value })}
                          className="w-full border border-slate-200 bg-white dark:bg-slate-950 p-1.5 rounded text-[10px] italic text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ORIGINAL STANDARD FORM FIELDS */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Primary Letter Wish (Or write your own)</label>
                    <textarea
                      rows={4}
                      placeholder="Type full custom birthday wishes here..."
                      value={formState.customMessage}
                      onChange={(e) => setFormState({ ...formState, customMessage: e.target.value })}
                      className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-xs focus:outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Rhyming Poem (Or short song)</label>
                    <textarea
                      rows={3}
                      placeholder="Type a beautiful 4-line rhyme stanzas..."
                      value={formState.poem}
                      onChange={(e) => setFormState({ ...formState, poem: e.target.value })}
                      className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-xs font-serif leading-relaxed focus:outline-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Mystery Gift Box Hint</label>
                      <input
                        type="text"
                        placeholder="e.g. An invisible kitten cuddle"
                        value={formState.giftClue}
                        onChange={(e) => setFormState({ ...formState, giftClue: e.target.value })}
                        className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-xs focus:outline-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Balloon Pop Catchphrase</label>
                      <input
                        type="text"
                        placeholder="e.g. Best code-mate alive!"
                        value={formState.shortQuote}
                        onChange={(e) => setFormState({ ...formState, shortQuote: e.target.value })}
                        className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-xs focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEC 4: CARD THEMES & INTERACTIVES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-250/60 dark:border-slate-800/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-extrabold pb-3 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-sm bg-indigo-50 text-indigo-500 py-1 px-2 rounded">04</span>
              <h2 className="text-sm uppercase tracking-wider">Aesthetic Theme & Music</h2>
            </div>

            {/* EMOTION PICKER */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select Card Vibe / Emotion Style</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: "funny", emoji: "🤪", label: "Funny" },
                  { id: "emotional", emoji: "❤️", label: "Emotional" },
                  { id: "poetic", emoji: "📜", label: "Poetic" },
                  { id: "cute", emoji: "🥰", label: "Cute" },
                  { id: "celebratory", emoji: "🥂", label: "Celebration" },
                ].map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => setFormState({ ...formState, emotion: em.id as any })}
                    className={`pb-1.5 pt-2 rounded-xl text-center border cursor-pointer flex flex-col items-center justify-center transition-all ${
                      (formState.emotion || "funny") === em.id
                        ? "bg-indigo-600 border-indigo-500 text-white scale-105 font-bold shadow-sm shadow-indigo-100 dark:shadow-none"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-150 hover:bg-slate-100 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="text-xl mb-0.5">{em.emoji}</span>
                    <span className="text-[9px] uppercase tracking-wider">{em.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* THEME PICKER */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select Interactive Backdrop Theme</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: "pastel", emoji: "🌸", label: "Pastels" },
                  { id: "midnight", emoji: "👑", label: "Midnight" },
                  { id: "kawaii", emoji: "🍭", label: "Kawaii" },
                  { id: "disco", emoji: "🪩", label: "Retro" },
                  { id: "space", emoji: "👽", label: "Cosmic" },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setFormState({ ...formState, theme: th.id as any })}
                    className={`pb-1.5 pt-2 rounded-xl text-center border cursor-pointer flex flex-col items-center justify-center transition-all ${
                      formState.theme === th.id
                        ? "bg-slate-900 border-indigo-500 scale-105 text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-150 hover:bg-slate-100 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="text-xl mb-0.5">{th.emoji}</span>
                    <span className="text-[9px] uppercase tracking-wider">{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MUSIC SYNTH CHANNEL */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select Web Synth Loop Soundtrack</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: "piano", emoji: "🎹", label: "Cozy Piano" },
                  { id: "chiptune", emoji: "👾", label: "Chiptune" },
                  { id: "festive", emoji: "🎺", label: "Traditional" },
                  { id: "zen", emoji: "🌾", label: "Ambient" },
                  { id: "none", emoji: "🔇", label: "Muted" },
                ].map((mu) => (
                  <button
                    key={mu.id}
                    type="button"
                    onClick={() => setFormState({ ...formState, music: mu.id as any })}
                    className={`pb-1.5 pt-2 rounded-xl text-center border cursor-pointer flex flex-col items-center justify-center transition-all ${
                      formState.music === mu.id
                        ? "bg-slate-900 border-indigo-500 scale-105 text-white font-bold"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-150 hover:bg-slate-100 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className="text-lg mb-0.5">{mu.emoji}</span>
                    <span className="text-[9px] uppercase tracking-wider">{mu.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* INTERACTIVE CHALLENGES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Surprise Challenges</label>
                <select
                  value={formState.interactiveChallenge}
                  onChange={(e) => setFormState({ ...formState, interactiveChallenge: e.target.value as any })}
                  className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-xs focus:outline-indigo-500"
                >
                  <option value="all">Collect All (Cake, Pop Balloons, Unbox)</option>
                  <option value="cake">Blow Cake Candle Only</option>
                  <option value="balloons">Pop Helium Balloons Only</option>
                  <option value="gift">Unwrap Custom Gift Box Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Virtual Cake Topping Flavor</label>
                <select
                  value={formState.cakeType}
                  onChange={(e) => setFormState({ ...formState, cakeType: e.target.value as any })}
                  className="w-full border border-slate-305 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-slate-800 dark:text-white text-xs focus:outline-indigo-500"
                >
                  <option value="strawberry">Strawberry Pink Cream Frosting</option>
                  <option value="chocolate">Midnight Cocoa Rich Chocolate</option>
                  <option value="unicorn">Rainbow Pastel Sparkle Unicorn</option>
                </select>
              </div>
            </div>

            {/* CUSTOM BACKGROUND DESIGNER */}
            <div className="pt-4 border-t border-dashed border-slate-100 dark:border-slate-850 space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">🖼️ Custom Card Background (Photo or Video)</label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "color", label: "Default Theme" },
                  { id: "image", label: "Custom Photo" },
                  { id: "video", label: "Custom Video" },
                ].map((bgType) => (
                  <button
                    key={bgType.id}
                    type="button"
                    onClick={() => {
                      setFormState({
                        ...formState,
                        customBgType: bgType.id as any,
                        // Clear background if default theme is selected
                        customBgUrl: bgType.id === "color" ? undefined : formState.customBgUrl,
                      });
                    }}
                    className={`py-2 rounded-xl text-xs text-center border cursor-pointer font-bold transition-all ${
                      (formState.customBgType || "color") === bgType.id
                        ? "bg-slate-900 border-indigo-500 text-white"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-150 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {bgType.label}
                  </button>
                ))}
              </div>

              {formState.customBgType && formState.customBgType !== "color" && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Option A: Upload Background File (Max 2MB)
                    </label>
                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-indigo-300 hover:border-indigo-500 bg-white dark:bg-slate-900 rounded-xl cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-600">
                        {formState.customBgUrl?.startsWith("data:") ? "Replace custom file" : `Upload background ${formState.customBgType}`}
                      </span>
                      <input
                        type="file"
                        accept={formState.customBgType === "video" ? "video/*" : "image/*"}
                        onChange={handleBackgroundUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center text-slate-400 my-1 justify-center space-x-2 text-[10px] font-mono">
                    <span className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800" />
                    <span>OR</span>
                    <span className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Option B: Paste Direct Web URL
                    </label>
                    <input
                      type="url"
                      placeholder={
                        formState.customBgType === "video"
                          ? "https://example.com/birthday-video.mp4"
                          : "https://example.com/gorgeous-photo.jpg"
                      }
                      value={formState.customBgUrl && !formState.customBgUrl.startsWith("data:") ? formState.customBgUrl : ""}
                      onChange={(e) => {
                        setFormState({
                          ...formState,
                          customBgUrl: e.target.value || undefined,
                        });
                      }}
                      className="w-full border border-slate-305 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                    <p className="text-[8px] text-slate-400 mt-1">
                      Direct URLs bypass file size limits and are highly recommended for large high-definition media!
                    </p>
                  </div>

                  {formState.customBgUrl && (
                    <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Background Media is Active
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormState({
                              ...formState,
                              customBgUrl: undefined,
                            });
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold border-0 bg-transparent cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Preview Thumb */}
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 relative flex items-center justify-center border border-slate-200 dark:border-slate-800">
                        {formState.customBgType === "video" ? (
                          <video
                            src={formState.customBgUrl}
                            muted
                            autoPlay
                            loop
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={formState.customBgUrl}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-[10px] text-white font-mono font-bold">
                          Live Background Preview
                        </div>
                      </div>

                      {/* Opacity Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>OVERLAY DARKNESS</span>
                          <span>{formState.customBgOpacity ?? 45}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={formState.customBgOpacity ?? 45}
                          onChange={(e) => {
                            setFormState({
                              ...formState,
                              customBgOpacity: parseInt(e.target.value),
                            });
                          }}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[8px] text-slate-400">
                          Higher darkness helps text pop. Slide left to make the background media fully bright and clear!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEC 5: FINAL SHARING ENGINE */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-3xl p-6 shadow-lg text-center space-y-4">
            <h3 className="text-lg font-black flex items-center justify-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>Unleash Your Interactive Surprise!</span>
            </h3>
            <p className="text-xs font-light text-rose-100 max-w-sm mx-auto leading-relaxed">
              We generate a short sharing URL loaded with your customized details and uploaded high-clarity photo! Send this beautiful surprise instantly.
            </p>

            <button
              onClick={handleGenerateLink}
              disabled={isGeneratingLink}
              className="w-full bg-white disabled:opacity-75 text-rose-600 font-black hover:bg-rose-50 active:scale-95 py-3.5 px-6 rounded-2xl shadow-md transition-all cursor-pointer text-sm uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {isGeneratingLink ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                  <span>Shrinking Custom URL Card...</span>
                </>
              ) : (
                <span>GENERATE SHORT GREETING LINK</span>
              )}
            </button>

            {generateLinkError && (
              <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl text-xs text-white flex items-center gap-1.5 justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
                <span>{generateLinkError}</span>
              </div>
            )}
          </div>

          {/* LINK REVEAL MODAL PREVIEW */}
          {generatedLink && (
            <div className="bg-[#0f1131] text-amber-100 rounded-3xl border-2 border-emerald-500/50 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Check className="w-5 h-5" />
                  <span>Card generated successfully!</span>
                </div>
                {isShortening && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full animate-pulse border border-amber-500/20 font-mono">
                    Shortening...
                  </span>
                )}
                {!isShortening && shortenedLink && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold font-sans">
                    ✨ Short Link Ready
                  </span>
                )}
              </div>

              {/* Link Type Segmented Control/Tabs */}
              {shortenedLink && (
                <div className="bg-slate-950/60 p-1 rounded-xl border border-white/5 grid grid-cols-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setUseShortLink(true)}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      useShortLink 
                        ? "bg-rose-500 text-white shadow-md" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Short Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseShortLink(false)}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      !useShortLink 
                        ? "bg-rose-500 text-white shadow-md" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Original Link
                  </button>
                </div>
              )}

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono select-all break-all text-amber-200 min-h-[50px] flex items-center justify-center">
                {(useShortLink && shortenedLink) ? shortenedLink : generatedLink}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="bg-[#181d50] hover:bg-[#202766] border border-slate-700 p-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center space-x-2"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>{copied ? "Copied!" : "Copy surprise link"}</span>
                </button>

                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 p-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center space-x-2 border-0"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Share on WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.open((useShortLink && shortenedLink) ? shortenedLink : generatedLink, "_blank")}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-2 border-0"
              >
                <span>TEST GREETING IN NEW WINDOW</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REAL-TIME SURPRISE PREVIEW WITH RESPONSIVE SIMULATOR (Lg: 5 cells) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-light dark:border-slate-800 mb-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-500 flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                <span>Live Preview Area (Interactive Simulator)</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-mono py-0.5 px-3 rounded">
                SIMULATOR
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 font-light mb-4">
              Test popping the balloons, unwrapping your message box, blowing the candles, or listening to the Web Synthesizer live below:
            </p>

            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-inner max-h-[85vh] overflow-y-auto bg-slate-905">
              <BirthdayCardViewer state={formState} isInteractivePreview={true} />
            </div>
          </div>
        </div>

      </main>

      <footer className="bg-slate-100 dark:bg-slate-950 py-8 text-center border-t border-slate-200 dark:border-slate-900 mt-12">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-xs text-slate-500 leading-relaxed font-light">
            An premium AI-powered design artifact crafted with 💖 using React & Gemini 3.5 Flash model telemetry parameters.
          </p>
          <div className="flex justify-center space-x-2 text-[10px] text-slate-400 font-mono">
            <span>Happy Coding</span>
            <span>•</span>
            <span>No Cookies Tracked</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
