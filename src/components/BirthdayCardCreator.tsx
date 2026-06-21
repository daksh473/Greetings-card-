import React, { useState } from "react";
import { BirthdayCardState, SuggestionParams, BirthdayTheme, MusicChoice, InteractiveChallenge, CakeType } from "../types";
import { encodeCardState, AVATAR_OPTIONS } from "../utils/sharing";
import { Sparkles, Gift, Music, Copy, Share2, ExternalLink, RefreshCw, Check, AlertCircle, Heart, Star, Send, Trash2, Upload } from "lucide-react";
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
  });

  // 2. AI Wizard Suggestion Parameters
  const [suggestionTone, setSuggestionTone] = useState<"emotional" | "funny" | "poetic" | "cute">("funny");
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // 3. Generated Share State
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generateLinkError, setGenerateLinkError] = useState<string | null>(null);

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
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    if (!generatedLink) return;
    const text = `🎉 I have created a personalized interactive birthday greeting card for you! Click here to open: ${generatedLink}`;
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
              <span className="text-sm bg-indigo-50 text-indigo-500 py-1 px-2 rounded">03</span>
              <h2 className="text-sm uppercase tracking-wider">Review Card Letter Content</h2>
            </div>

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
          </div>

          {/* SEC 4: CARD THEMES & INTERACTIVES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-250/60 dark:border-slate-800/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-extrabold pb-3 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-sm bg-indigo-50 text-indigo-500 py-1 px-2 rounded">04</span>
              <h2 className="text-sm uppercase tracking-wider">Aesthetic Theme & Music</h2>
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
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Check className="w-5 h-5" />
                <span>Card generated successfully!</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono select-all break-all text-amber-200">
                {generatedLink}
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
                onClick={() => window.open(generatedLink, "_blank")}
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
