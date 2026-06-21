import { useState, useEffect } from "react";
import { BirthdayCardState } from "./types";
import { decodeCardState } from "./utils/sharing";
import BirthdayCardCreator from "./components/BirthdayCardCreator";
import BirthdayCardViewer from "./components/BirthdayCardViewer";

export default function App() {
  const [sharedCardState, setSharedCardState] = useState<BirthdayCardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCard() {
      const params = new URLSearchParams(window.location.search);
      const cardParam = params.get("card");
      // Support '?c=' or '?id=' as short code parameter keys
      const shortId = params.get("c") || params.get("id");

      if (shortId) {
        try {
          // Attempt client-side loading from Google Cloud Firestore directly
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("./lib/firebase");
          
          const docRef = doc(db, "cards", shortId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setSharedCardState(docSnap.data() as BirthdayCardState);
          } else {
            // Fallback: If client-side failed, maybe let's pull from Express /api/cards endpoint (precautionary)
            const res = await fetch(`/api/cards/${shortId}`);
            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              throw new Error(errJson.error || "The requested short greeting card could not be found.");
            }
            const cardData = await res.json();
            setSharedCardState(cardData);
          }
        } catch (err: any) {
          console.error("Failed to load shortened card:", err);
          setErrorMsg(err.message || "Failed to load shortened greeting card.");
        }
      } else if (cardParam) {
        const decoded = decodeCardState(cardParam);
        if (decoded) {
          setSharedCardState(decoded);
        } else {
          setErrorMsg("Could not parse the offline greeting card link.");
        }
      }
      setLoading(false);
    }

    loadCard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase">
          Unwrapping Surprise Invitation...
        </h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-black tracking-wide text-rose-400 capitalize mb-2">
          Surprise URL Error
        </h2>
        <p className="text-xs text-slate-405 max-w-md mx-auto leading-relaxed mb-6">
          {errorMsg}
        </p>
        <button
          onClick={() => {
            // Clean up query string and start designing empty card
            window.history.replaceState({}, document.title, window.location.pathname);
            setErrorMsg(null);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
        >
          Create A New Birthday Surprise Card
        </button>
      </div>
    );
  }

  // If a shared greeting card is detected in URL, render the viewer directly!
  if (sharedCardState) {
    return (
      <div className="min-h-screen">
        <BirthdayCardViewer state={sharedCardState} />
      </div>
    );
  }

  // Otherwise, render the Creator Dashboard Console
  return <BirthdayCardCreator />;
}
