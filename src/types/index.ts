// ここにいるワン - Type Definitions

export type TimeSlot = "morning" | "afternoon" | "evening";
export type PlanStatus = "tentative" | "confirmed";
export type DogSize = "small" | "medium" | "large";

export interface Dog {
  id: string;
  name: string;
  breed?: string;
  size: DogSize;
  tags: string[]; // 性格タグ
  avatarEmoji: string; // 犬の絵文字アバター
  photoUrl?: string;
}

export interface User {
  id: string;
  displayName: string;
  friendCode: string;
  pin?: string; // 4-digit PIN for login
  dogs: Dog[];
}

export interface Park {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  openTime: string;
  closeTime: string;
  hasParkingLot: boolean;
  fee: string;
  requiresCertificate: boolean;
  notes: string;
  imageEmoji: string;
}

export interface Plan {
  id: string;
  parkId: string;
  creatorId: string;
  date: string; // ISO date string YYYY-MM-DD
  timeSlot: TimeSlot;
  status: PlanStatus;
  note: string;
  participantIds: string[];
  createdAt: string;
  isAnonymous?: boolean; // 匿名参加
}

export interface Message {
  id: string;
  planId: string;
  senderId: string; // "system" for system messages
  text: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "plan_join" | "plan_confirmed" | "friend_accepted" | "friend_request";
  title: string;
  body: string;
  planId?: string;
  friendId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppState {
  currentUserId: string | null;
  users: User[];
  plans: Plan[];
  messages: Message[];
  friendRequests: FriendRequest[];
  notifications: Notification[];
}
