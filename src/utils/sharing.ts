import { BirthdayCardState } from "../types";

/**
 * Encodes card state into a URL-safe Base64 string
 */
export function encodeCardState(state: BirthdayCardState): string {
  try {
    const jsonStr = JSON.stringify(state);
    // Use encodeURIComponent & unescape to handle UTF-8 characters (like emojis) correctly in btoa
    const compressed = btoa(unescape(encodeURIComponent(jsonStr)));
    return compressed;
  } catch (err) {
    console.error("Failed to encode card state", err);
    return "";
  }
}

/**
 * Decodes a Base64 string back into a card state
 */
export function decodeCardState(encoded: string): BirthdayCardState | null {
  if (!encoded) return null;
  try {
    const decodedStr = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(decodedStr);
    
    // Ensure all required properties are present, apply defaults if necessary
    return {
      recipientName: parsed.recipientName || "Friend",
      recipientAge: parsed.recipientAge !== undefined ? String(parsed.recipientAge) : "",
      relationship: parsed.relationship || "Friend",
      theme: parsed.theme || "pastel",
      music: parsed.music || "piano",
      interactiveChallenge: parsed.interactiveChallenge || "all",
      avatarUrl: parsed.avatarUrl || "kitty",
      customMessage: parsed.customMessage || "Wishing you an amazing day filled with laughter and joy!",
      poem: parsed.poem || "",
      giftClue: parsed.giftClue || "",
      shortQuote: parsed.shortQuote || "",
      cakeType: parsed.cakeType || "strawberry",
      interests: parsed.interests || "",
    };
  } catch (err) {
    console.error("Failed to decode card state", err);
    return null;
  }
}

/**
 * Predefined adorable profile avatars for the recipient if they do not specify a custom URL
 */
export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "kitty", name: "Cute Kitty", emoji: "🐱", color: "bg-pink-100 border-pink-300" },
  { id: "shiba", name: "Joyful Shiba", emoji: "🐶", color: "bg-amber-100 border-amber-300" },
  { id: "bear", name: "Bobba Bear", emoji: "🐻", color: "bg-orange-100 border-orange-300" },
  { id: "astronaut", name: "Astronaut", emoji: "🚀", color: "bg-indigo-100 border-indigo-300" },
  { id: "dino", name: "Lil Dino", emoji: "🦖", color: "bg-emerald-100 border-emerald-300" },
  { id: "cupcake", name: "Unicorn Cake", emoji: "🧁", color: "bg-purple-100 border-purple-300" },
];
