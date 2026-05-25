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
  accountId: string; // user-defined login ID
  friendCode: string; // auto-generated, internal
  pin?: string; // legacy 4-digit PIN (kept for seed back-compat)
  password?: string; // seed-time only
  dogs: Dog[];
}

export type DogRunType = "indoor" | "outdoor" | "both";
export type DogRunAreaSize = "S" | "M" | "L";

export interface Park {
  id: string;
  name: string;
  address: string;
  imageEmoji: string;

  // Pre-shared facility data (dogrun_data.csv)
  area?: string;          // 都道府県＋市町村
  smallDogArea?: boolean; // 小型犬エリア
  bigDogArea?: boolean;   // 大型犬エリア
  freeDogArea?: boolean;  // フリーエリア
  type?: DogRunType;      // indoor / outdoor / both
  areaSize?: DogRunAreaSize;
  official?: boolean;     // 公式施設フラグ

  // Legacy fields — kept optional for back-compat with older mock entries
  distanceKm?: number;
  openTime?: string;
  closeTime?: string;
  hasParkingLot?: boolean;
  fee?: string;
  requiresCertificate?: boolean;
  notes?: string;
}

export type EventType =
  | "plan_join"
  | "status_change"
  | "participants_changed"
  | "plan_created";

export interface AppEvent {
  id: string;
  type: EventType;
  userId: string;
  planId?: string;
  parkId?: string;
  fromStatus?: PlanStatus;
  toStatus?: PlanStatus;
  participantCount?: number;
  createdAt: string;
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
