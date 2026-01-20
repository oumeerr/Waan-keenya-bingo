
export enum Language {
  ENGLISH = 'en',
  AMHARIC = 'am',
  OROMOO = 'om',
  TIGRINYA = 'ti'
}

export type View = 'home' | 'wallet' | 'leaderboard' | 'history' | 'profile' | 'how-to-play' | 'betting-list' | 'card-selection' | 'game' | 'promo' | 'settings' | 'all-cards';

export interface BingoCard {
  id: number;
  grid: number[][]; // 5x5
}

export interface User {
  username: string;
  mobile: string;
  balance: number;
  referrals: number;
  photo: string;
}

export interface Bank {
  id: string;
  name: string;
}