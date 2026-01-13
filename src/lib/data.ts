'use client';
import type { ImagePlaceholder } from './placeholder-images';
import { differenceInMinutes } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';


export type PersonalityTrait = {
  trait: string;
  userScore: number;
  viewerScore: number;
};

export type Prompt = {
  question: string;
  answer: string;
};

export type Swipe = {
  id: string; // The doc ID, which is the liker's UID
  type: 'like' | 'nope' | 'superlike';
  timestamp: any;
  // Denormalized data to prevent extra reads on the 'Likes' screen
  likerId: string;
  likerName: string;
  likerAvatar: string;
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
  email: string;
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
  isSystemAccount?: boolean;
  // User Preferences
  interestedIn?: 'man' | 'woman' | 'everyone';
  globalMode?: boolean;
  maxDistance?: number;
  ageRange?: [number, number];
  // Premium Status
  isPremium?: boolean;
  subscriptionId?: string;
  purchaseToken?: string;
  expiryDate?: any;
  autoRenewing?: boolean;
  premiumTier?: 'weekly' | 'gold' | 'platinum' | null;
  premiumExpiresAt?: any; // Firestore Timestamp
  superLikes?: number;
  boostExpiresAt?: any; // Firestore Timestamp
  // Usage tracking
  lastRewindAt?: any;
  rewindCount?: number;
  // Admin
  role?: 'admin' | 'moderator' | 'support' | 'user';
  isBanned?: boolean;
  createdAt?: any;
  // Personality Traits for compatibility
  personalityTraits?: {
      [key: string]: number
  };
}

export type Match = {
    id: string;
    users: string[];
    timestamp: any;
    lastMessage: string;
    isBlocked?: boolean;
    blockedBy?: string;
    typing?: { [userId: string]: boolean };
    // Denormalized user info to prevent N+1 reads on the lounge page.
    // The keys will be dynamic, e.g., 'user_info_userId1', 'user_info_userId2'
    [key: `user_info_${string}`]: {
        name: string;
        avatarUrl: string;
    };
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


// --- New Ad Types for Discover Feed ---
export type AdItem = {
  id: string;
  type: 'ad';
};

export type UserItem = {
  type: 'user';
  user: UserProfile;
};

export type SwipeItem = UserItem | AdItem;

export type VoiceRoom = {
    id: string;
    title: string;
    ownerId: string;
    isPublic: boolean;
    passwordHash?: string;
    participantCount: number;
    maxParticipants: number;
    createdAt: Timestamp;
    bannedUserIds: string[];
};

export type WebRTCSignal = {
    type: 'offer' | 'answer' | 'candidate';
    sdp?: string;
    candidate?: object;
};
