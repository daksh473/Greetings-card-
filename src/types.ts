/**
 * Types defining the state and options of a personalized birthday card
 */

export type BirthdayTheme = "midnight" | "pastel" | "kawaii" | "disco" | "space";
export type MusicChoice = "piano" | "chiptune" | "festive" | "zen" | "none";
export type InteractiveChallenge = "cake" | "balloons" | "gift" | "all";
export type CakeType = "strawberry" | "chocolate" | "unicorn";

export interface BirthdayCardState {
  recipientName: string;
  recipientAge: string; // string so it can be blank or custom text like "25th"
  relationship: string;
  theme: BirthdayTheme;
  music: MusicChoice;
  interactiveChallenge: InteractiveChallenge;
  avatarUrl: string; // custom image url
  customMessage: string;
  poem: string;
  giftClue: string;
  shortQuote: string;
  cakeType: CakeType;
  interests?: string;
  balloonCount?: number;
  emotion?: "funny" | "emotional" | "poetic" | "cute" | "celebratory";

  // Custom Pinterest Cute Pastel Card Fields
  isPinterestCard?: boolean;
  pinterestMemories?: string;
  pinterestFavouriteThings?: string;
  pinterestSong?: string;
  pinterestHeroBadge?: string;
  pinterestHeroHeading?: string;
  pinterestHeroSubtitle?: string;
  pinterestLetterTitle?: string;
  pinterestLetterParagraph?: string;
  pinterestSongCaption?: string;
  pinterestMemory1?: string;
  pinterestMemory2?: string;
  pinterestMemory3?: string;
  pinterestWishParagraph?: string;
  pinterestFinalTitle?: string;
  pinterestFinalLetter?: string;
}

export interface SuggestionParams {
  name: string;
  age: string;
  relationship: string;
  interests: string;
  tone: "emotional" | "funny" | "poetic" | "cute";
  isPinterest?: boolean;
  memories?: string;
  favouriteThings?: string;
  song?: string;
}

export interface GeneratedWishResponse {
  wish: string;
  shortQuote: string;
  poem: string;
  giftClue: string;
  
  // Custom Pinterest fields
  pinterestHeroBadge?: string;
  pinterestHeroHeading?: string;
  pinterestHeroSubtitle?: string;
  pinterestLetterTitle?: string;
  pinterestLetterParagraph?: string;
  pinterestSongCaption?: string;
  pinterestMemory1?: string;
  pinterestMemory2?: string;
  pinterestMemory3?: string;
  pinterestWishParagraph?: string;
  pinterestFinalTitle?: string;
  pinterestFinalLetter?: string;
}
