import { useState, useEffect } from "react";
import { BirthdayCardState } from "./types";
import { decodeCardState } from "./utils/sharing";
import BirthdayCardCreator from "./components/BirthdayCardCreator";
import BirthdayCardViewer from "./components/BirthdayCardViewer";

export default function App() {
  const [sharedCardState, setSharedCardState] = useState<BirthdayCardState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse the URL search query param 'card'
    const params = new URLSearchParams(window.location.search);
    const cardParam = params.get("card");

    if (cardParam) {
      const decoded = decodeCardState(cardParam);
      if (decoded) {
        setSharedCardState(decoded);
      }
    }
    setLoading(false);
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
