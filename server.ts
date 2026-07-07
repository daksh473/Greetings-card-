import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with lazy initialization & telemetry.
let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add your Gemini API Key in the 'Settings' > 'Secrets' panel of Google AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// API endpoint to suggest custom wishes via server-side Gemini 3.5 Flash
app.post("/api/suggest-wish", async (req, res) => {
  try {
    const { name, age, relationship, interests, tone, isPinterest, memories, favouriteThings, song } = req.body;

    if (!name) {
      res.status(400).json({ error: "Recipient name is required" });
      return;
    }

    let ai;
    try {
      ai = getAi();
    } catch (apiError: any) {
      console.error("Gemini init error:", apiError);
      res.status(401).json({
        error: apiError.message,
        details: "Missing API Key",
      });
      return;
    }

    const agePhrase = age ? `who is turning ${age} years old` : "";
    const interestsPhrase = interests ? `and loves [${interests}]` : "";
    const toneDescription = {
      emotional: "Heartwarming, sentimental, emotional, and very tear-jerking. Emphasize close bonds, beautiful memories, and appreciation.",
      funny: "Playful, funny, roast-style but loving. Include a witty lighthearted joke, pun, or teasing comment suited for their relationship.",
      poetic: "Elegant, lyrical, poetic, and whimsical, utilizing stars, beautiful nature metaphors, and rhythmic expression.",
      cute: "Super cute, simple, sweet, and adorable. Friendly emojis, high cheering spirit, and straightforward birthday joy.",
    }[tone as "emotional" | "funny" | "poetic" | "cute"] || "Cute, positive, and delightful.";

    let promptString = "";
    let responseSchemaProperties: Record<string, any> = {
      wish: {
        type: Type.STRING,
        description: "The main beautifully formatted birthday wishes letter (around 2-3 paragraphs or structured paragraphs). Keep it personal, highly detailed, and engaging.",
      },
      shortQuote: {
        type: Type.STRING,
        description: "A short, cute, catchy 1-sentence greeting (e.g. 'To the coffee-fueled MVP of my life!'). Ideal for showing inside a popped balloon.",
      },
      poem: {
        type: Type.STRING,
        description: "A gorgeous 4-line rhythmic, rhyming birthday poem specifically customized with details of their relationship, age, or interests.",
      },
      giftClue: {
        type: Type.STRING,
        description: "A playful, tiny, intriguing interactive joke clue about what could be inside their виртуальный gift box (e.g., 'An infinite supply of caffeine and virtual hugs!').",
      }
    };
    let requiredFields = ["wish", "shortQuote", "poem", "giftClue"];

    if (isPinterest) {
      promptString = `You are designing a cute pastel Pinterest birthday card website.
Draft custom sweet, warm, soft, emotional, and personal text for the sections of a multi-step Birthday Greeting Card website.
Use lowercase letters when suitable to give a sweet handwritten, genuine note feeling.
Recipient: ${name} (who is turning ${age || 'this year'} years old)
Relationship: ${relationship}
Special memories with them: "${memories || 'none specified'}"
Their favorite things: "${favouriteThings || interests || 'none specified'}"
Background Song chosen: "${song || 'piano'}"

Please generate specific creative contents for these 5 exact sections:
1. HERO PAGE:
   - Badge text: A short minimal badge starting with "♡" (e.g. "♡ a birthday surprise" or similar sweet badge).
   - Heading: Main visual cute lowercase phrase (e.g., "a little something for you" or similar).
   - Subtitle: Lowkey heartfelt caption (e.g., "happy birthday ♡" or similar).
2. OPEN LETTER PAGE:
   - Heartfelt paragraph: A warm, soft, personal letter paragraph (40-60 words).
   - Song caption: A caption mentioning the song "${song || 'this song'}" (e.g., "press play — i picked this one because it always reminds me of you." or custom playful caption).
3. OUR LITTLE ALBUM:
   - Memory captions: Three memories based on the provided memories and favorite things:
     * Memory 1: Short cute line about smiles, laughter, or the first memory.
     * Memory 2: Short line about a favourite customized moment together.
     * Memory 3: A thankful emotional, heartwarming line looking back.
4. WISH PAGE:
   - Wish paragraph: A sweet, cozy, handwritten feeling birthday wish (around 50 words) thanking them for things like patience, late-night talks, silly inside jokes, and being themselves.
5. FINAL LETTER PAGE:
   - Title: E.g., "happy birthday ${name} ♡" (or similar sweet title).
   - Final letter: A beautiful emotional birthday letter (80-120 words) that feels extremely genuine, soft, romantic/wholesome, warm, like a handwritten letter.

Make sure the output matches the requested JSON schema.`;

      responseSchemaProperties = {
        ...responseSchemaProperties,
        pinterestHeroBadge: {
          type: Type.STRING,
          description: "Small badge text starting with '♡' (e.g. '♡ a birthday surprise')",
        },
        pinterestHeroHeading: {
          type: Type.STRING,
          description: "Main bold visual heading in lowercase (e.g. 'a little something for you')",
        },
        pinterestHeroSubtitle: {
          type: Type.STRING,
          description: "Aesthetic subtitle (e.g. 'happy birthday ♡')",
        },
        pinterestLetterTitle: {
          type: Type.STRING,
          description: "Title of the open letter page (e.g. 'Happy Birthday')",
        },
        pinterestLetterParagraph: {
          type: Type.STRING,
          description: "Short heartfelt paragraph (40-60 words) that is incredibly sweet, warm, and personal.",
        },
        pinterestSongCaption: {
          type: Type.STRING,
          description: "A cute note about the song (e.g. 'press play — i picked this one because it always reminds me of you.')",
        },
        pinterestMemory1: {
          type: Type.STRING,
          description: "Memory Caption 1: Short cute line about smiles, happiness, or a specific user-provided memory.",
        },
        pinterestMemory2: {
          type: Type.STRING,
          description: "Memory Caption 2: Short line about a favourite customized moment together.",
        },
        pinterestMemory3: {
          type: Type.STRING,
          description: "Memory Caption 3: Thankful emotional line expressing how happy you are to have them.",
        },
        pinterestWishParagraph: {
          type: Type.STRING,
          description: "A sweet birthday wish of around 50 words: 'thank you for being you — for the patience, the late-night talks...'",
        },
        pinterestFinalTitle: {
          type: Type.STRING,
          description: "Aesthetic lowercase title for final card page (e.g. 'happy birthday ♡')",
        },
        pinterestFinalLetter: {
          type: Type.STRING,
          description: "A beautiful emotional birthday letter of 80-120 words. Feels like a handwritten note, lowercase when suitable.",
        },
      };

      requiredFields = [
        ...requiredFields,
        "pinterestHeroBadge",
        "pinterestHeroHeading",
        "pinterestHeroSubtitle",
        "pinterestLetterTitle",
        "pinterestLetterParagraph",
        "pinterestSongCaption",
        "pinterestMemory1",
        "pinterestMemory2",
        "pinterestMemory3",
        "pinterestWishParagraph",
        "pinterestFinalTitle",
        "pinterestFinalLetter"
      ];
    } else {
      promptString = `Draft beautiful individualized birthday wishes for ${name} ${agePhrase}, who is my ${relationship} ${interestsPhrase}.
Specific style requirements: ${toneDescription}
The response should be standard JSON matching the requested schema. Provide custom creative text.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptString,
      config: {
        systemInstruction: "You are a professional, charming, cozy Pinterest-style greeting card planner. Help write unique, customized birthday wishes, letters, and cute memories with whimsical, sweet lowercase phrasing and adorable pixel-art/kawaii feelings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: responseSchemaProperties,
          required: requiredFields,
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini API");
    }

    const payload = JSON.parse(text.trim());
    res.json(payload);
  } catch (err: any) {
    console.error("Gemini suggestion error:", err);
    res.status(500).json({
      error: err.message || "Could not generate creative wishes right now. Please try again or create a custom card manually!",
      details: err.toString(),
    });
  }
});

// === SERVER-SIDE PERSISTENT CARD SHORTENER DATABASE ===
import fs from "fs";

const DB_FILE = path.join(process.cwd(), "cards_db.json");
const cardsCache = new Map<string, any>();

function generateShortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function loadCardsDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(raw);
      for (const [key, value] of Object.entries(data)) {
        cardsCache.set(key, value);
      }
      console.log(`Loaded ${cardsCache.size} shortened cards from database storage.`);
    }
  } catch (error) {
    console.error("Error loading cards database file:", error);
  }
}

function saveCardToDB(id: string, cardState: any) {
  cardsCache.set(id, cardState);
  try {
    const rawObj: Record<string, any> = {};
    for (const [key, val] of cardsCache.entries()) {
      rawObj[key] = val;
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(rawObj, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to cards database file:", error);
  }
}

// Trigger initial load on server boot-up
loadCardsDB();

// API endpoint to store custom card and return randomized shortId
app.post("/api/cards", (req, res) => {
  try {
    const cardState = req.body;
    if (!cardState || !cardState.recipientName) {
      res.status(400).json({ error: "Invalid birthday card state" });
      return;
    }

    let shortId = generateShortId();
    while (cardsCache.has(shortId)) {
      shortId = generateShortId();
    }

    saveCardToDB(shortId, cardState);
    res.json({ id: shortId });
  } catch (err: any) {
    console.error("Error storing card in database:", err);
    res.status(500).json({ error: "Failed to create short sharing card link" });
  }
});

// API endpoint to lookup and retrieve card state by shortId
app.get("/api/cards/:id", (req, res) => {
  try {
    const { id } = req.params;
    const cardState = cardsCache.get(id);
    
    if (!cardState) {
      res.status(404).json({ error: "Birthday card not found or has expired!" });
      return;
    }
    
    res.json(cardState);
  } catch (err: any) {
    console.error("Error retrieving card from database:", err);
    res.status(500).json({ error: "Error reading secure card state" });
  }
});

// API endpoint to update specific fields of a card state by shortId
app.patch("/api/cards/:id", (req, res) => {
  try {
    const { id } = req.params;
    const cardState = cardsCache.get(id);
    
    if (!cardState) {
      res.status(404).json({ error: "Birthday card not found" });
      return;
    }
    
    const updatedState = { ...cardState, ...req.body };
    saveCardToDB(id, updatedState);
    res.json(updatedState);
  } catch (err: any) {
    console.error("Error updating card in database:", err);
    res.status(500).json({ error: "Failed to update card state" });
  }
});

// API endpoint to shorten URLs via external services (is.gd / tinyurl)
app.post("/api/shorten", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: "Missing url parameter" });
      return;
    }

    // Try shortening with is.gd first
    try {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json() as any;
        if (data && data.shorturl) {
          console.log("Successfully shortened URL using is.gd:", data.shorturl);
          res.json({ shortUrl: data.shorturl });
          return;
        }
      }
    } catch (err) {
      console.warn("is.gd shortening failed, falling back to tinyurl", err);
    }

    // Fallback to tinyurl.com
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const shortUrl = await response.text();
        if (shortUrl && shortUrl.startsWith("http")) {
          console.log("Successfully shortened URL using tinyurl:", shortUrl);
          res.json({ shortUrl });
          return;
        }
      }
    } catch (err) {
      console.warn("tinyurl shortening failed", err);
    }

    // If both failed, return the original url
    res.json({ shortUrl: url });
  } catch (error: any) {
    console.error("Error in shorten API:", error);
    res.status(500).json({ error: "Failed to shorten link" });
  }
});

// Start integration with Vite middleware
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
