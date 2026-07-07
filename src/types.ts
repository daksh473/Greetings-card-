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
  uploadedPhotos?: string[]; // compressed Base64 images array
  uploadedMusic?: string; // compressed Base64 MP3 URL or reference
  uploadedMusicName?: string; // custom title of the uploaded file
  passcode?: string; // 4-digit passcode gate for recipient
  passcodeBgUrl?: string; // custom background image URL/base64 for passcode lock screen
  
  // Custom Dear You card fields
  isDearYou?: boolean;
  dearYouFavoritePhoto?: string;
  dearYouFavoriteQuote?: string;
  dearYouMemoryCaption?: string;
  dearYouMem0?: string;
  dearYouMem1?: string;
  dearYouMem2?: string;
  dearYouMem3?: string;
  dearYouAge?: number;
  dearYouCakeWish?: string;
  dearYouHeadline?: string;
  dearYouHeadlinePhoto?: string;
  dearYouNoteText?: string;
  dearYouNotePhoto?: string;
  dearYouFinalMessage?: string;
  dearYouSenderName?: string;
  dearYouAccent?: string;

  // Custom Background Customization
  customBgType?: "color" | "image" | "video";
  customBgUrl?: string; // base64 or direct URL
  customBgOpacity?: number; // 0 to 100 for overlay opacity
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
