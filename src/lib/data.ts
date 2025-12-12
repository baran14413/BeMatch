'use client';
import type { ImagePlaceholder } from './placeholder-images';
import { differenceInMinutes } from 'date-fns';

export type PersonalityTrait = {
  trait: string;
  userScore: number;
  viewerScore: number;
};

export type Prompt = {
  question: string;
  answer: string;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any; // Can be Date or Firestore Timestamp
  updatedAt?: any;
  isEdited?: boolean;
  isRead: boolean;
  isAiGenerated?: boolean;
  reactions?: { [key: string]: string[] }; // emoji -> userId[]
  type?: 'text' | 'image' | 'voice';
  imageUrl?: string;
  isViewOnce?: boolean;
  isOpenedBy?: string[];
  audioUrl?: string;
  audioDuration?: number; // duration in seconds
  replyTo?: {
    messageId: string;
    text: string;
    senderId: string;
    type?: 'text' | 'image' | 'voice';
    imageUrl?: string;
  };
};

export interface UserProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  bio: string;
  gender: 'man' | 'woman';
  avatarUrl: string;
  imageUrls: string[];
  videoUrl?: string;
  videoDescription?: string;
  voiceNoteUrl?: string;
  prompts: Prompt[];
  zodiac: string;
  location: string;
  latitude?: number;
  longitude?: number;
  goal?: string;
  interests?: string[];
  distance?: number;
  lastSeen?: any;
  passwordLastUpdatedAt?: any;
  // User Preferences
  interestedIn?: 'man' | 'woman' | 'everyone';
  globalMode?: boolean;
  maxDistance?: number;
  ageRange?: [number, number];
  // Premium Status
  premiumTier?: 'plus' | 'gold' | 'platinum' | null;
  premiumExpiresAt?: any; // Firestore Timestamp
  superLikes?: number;
  boostExpiresAt?: any; // Firestore Timestamp
  // Usage tracking
  lastRewindAt?: any;
  rewindCount?: number;
}

export type Match = {
    id: string;
    users: string[];
    timestamp: any;
    lastMessage: string;
};


export type Conversation = {
  id: string; // This is the Match ID
  otherUser: UserProfile;
  messages: Message[];
};

export type UserStatus = {
    state: 'online' | 'offline';
    last_changed: number; // This will be a timestamp
};
