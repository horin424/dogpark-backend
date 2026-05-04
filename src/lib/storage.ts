"use client";

import {
    Plan,
    Message,
    FriendRequest,
    Notification,
    User,
} from "@/types";
import { MOCK_USERS, DEMO_USER_ID } from "@/data/mockData";

// ─── Keys ───────────────────────────────────────────────────────────────────
const KEYS = {
    currentUserId: "wan_currentUserId",
    users: "wan_users",
    plans: "wan_plans",
    messages: "wan_messages",
    friendRequests: "wan_friendRequests",
    notifications: "wan_notifications",
    profiles: "dogrun:profiles",
};

export interface DogProfile {
    dogName: string;
    photoDataUrl?: string;
    tags: string[];
    avatarEmoji: string;
}


// ─── Generic helpers ────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const v = localStorage.getItem(key);
        return v ? (JSON.parse(v) as T) : fallback;
    } catch {
        return fallback;
    }
}

function save<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export function getCurrentUserId(): string | null {
    return load<string | null>(KEYS.currentUserId, null);
}

export function login(userId: string): void {
    save(KEYS.currentUserId, userId);
}

/** Returns userId on success, null on failure */
export function loginWithPin(friendCode: string, pin: string): string | null {
    const users = getUsers();
    const user = users.find(
        (u) => u.friendCode.toLowerCase() === friendCode.trim().toLowerCase()
    );
    if (!user) return null;
    if (user.pin !== pin.trim()) return null;
    save(KEYS.currentUserId, user.id);
    return user.id;
}

/** Set or update a user's PIN */
export function setPinForUser(userId: string, pin: string): void {
    const users = getUsers();
    const updated = users.map((u) => u.id === userId ? { ...u, pin } : u);
    saveUsers(updated);
}

export function logout(): void {
    localStorage.removeItem(KEYS.currentUserId);
}

export function isLoggedIn(): boolean {
    return getCurrentUserId() !== null;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export function getUsers(): User[] {
    return load<User[]>(KEYS.users, MOCK_USERS);
}

export function saveUsers(users: User[]): void {
    save(KEYS.users, users);
}

export function getCurrentUser(): User | null {
    const id = getCurrentUserId();
    if (!id) return null;
    return getUsers().find((u) => u.id === id) ?? null;
}

export function getUserById(id: string): User | undefined {
    return getUsers().find((u) => u.id === id);
}

// ─── Plans ───────────────────────────────────────────────────────────────────
export function getPlans(): Plan[] {
    return load<Plan[]>(KEYS.plans, []);
}

export function savePlans(plans: Plan[]): void {
    save(KEYS.plans, plans);
}

export function getPlanById(id: string): Plan | undefined {
    return getPlans().find((p) => p.id === id);
}

export function addPlan(plan: Plan): void {
    const plans = getPlans();
    plans.push(plan);
    savePlans(plans);
}

export function updatePlan(updated: Plan): void {
    const plans = getPlans().map((p) => (p.id === updated.id ? updated : p));
    savePlans(plans);
}

export function getActivePlans(): Plan[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getPlans().filter((p) => new Date(p.date) >= today);
}

export function getTodayPlans(): Plan[] {
    const today = todayString();
    return getPlans().filter((p) => p.date === today);
}

export function todayString(): string {
    return new Date().toISOString().split("T")[0];
}

// ─── Messages ────────────────────────────────────────────────────────────────
export function getMessages(): Message[] {
    return load<Message[]>(KEYS.messages, []);
}

export function saveMessages(messages: Message[]): void {
    save(KEYS.messages, messages);
}

export function getMessagesByPlan(planId: string): Message[] {
    return getMessages().filter((m) => m.planId === planId);
}

export function addMessage(msg: Message): void {
    const messages = getMessages();
    messages.push(msg);
    saveMessages(messages);
}

// ─── Friend Requests ─────────────────────────────────────────────────────────
export function getFriendRequests(): FriendRequest[] {
    return load<FriendRequest[]>(KEYS.friendRequests, []);
}

export function saveFriendRequests(reqs: FriendRequest[]): void {
    save(KEYS.friendRequests, reqs);
}

export function addFriendRequest(req: FriendRequest): void {
    const reqs = getFriendRequests();
    reqs.push(req);
    saveFriendRequests(reqs);
}

export function updateFriendRequest(updated: FriendRequest): void {
    const reqs = getFriendRequests().map((r) =>
        r.id === updated.id ? updated : r
    );
    saveFriendRequests(reqs);
}

export function getFriendIds(userId: string): string[] {
    const reqs = getFriendRequests();
    return reqs
        .filter(
            (r) =>
                r.status === "accepted" &&
                (r.fromId === userId || r.toId === userId)
        )
        .map((r) => (r.fromId === userId ? r.toId : r.fromId));
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function getNotifications(): Notification[] {
    return load<Notification[]>(KEYS.notifications, []);
}

export function saveNotifications(notifs: Notification[]): void {
    save(KEYS.notifications, notifs);
}

export function addNotification(notif: Notification): void {
    const notifs = getNotifications();
    notifs.unshift(notif);
    saveNotifications(notifs);
}

export function markNotificationRead(id: string): void {
    const notifs = getNotifications().map((n) =>
        n.id === id ? { ...n, isRead: true } : n
    );
    saveNotifications(notifs);
}

export function getUnreadCount(userId: string): number {
    return getNotifications().filter(
        (n) => n.userId === userId && !n.isRead
    ).length;
}

// ─── Profiles ────────────────────────────────────────────────────────────────
export function getProfiles(): Record<string, DogProfile> {
    return load<Record<string, DogProfile>>(KEYS.profiles, {});
}

export function saveProfiles(profiles: Record<string, DogProfile>): void {
    save(KEYS.profiles, profiles);
}

export function getProfileByFriendCode(friendCode: string): DogProfile | undefined {
    return getProfiles()[friendCode];
}

export function updateProfile(friendCode: string, profile: Partial<DogProfile>): void {
    const profiles = getProfiles();
    profiles[friendCode] = {
        ...(profiles[friendCode] || { dogName: "", tags: [], avatarEmoji: "🐕" }),
        ...profile,
    };
    saveProfiles(profiles);
}

// ─── Utility ─────────────────────────────────────────────────────────────────
export function generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function timeSlotLabel(slot: string): string {
    if (slot === "morning") return "午前";
    if (slot === "afternoon") return "午後";
    return "夕方";
}

export function timeSlotEmoji(slot: string): string {
    if (slot === "morning") return "🌅";
    if (slot === "afternoon") return "☀️";
    return "🌆";
}

export function statusLabel(status: string): string {
    return status === "confirmed" ? "確定" : "迷い中";
}

// Ensure demo data is seeded
export function seedDemoData(): void {
    if (typeof window === "undefined") return;

    // Seed users first
    if (!localStorage.getItem(KEYS.users)) {
        save(KEYS.users, MOCK_USERS);
    }

    // Seed profiles if none exist
    if (!localStorage.getItem(KEYS.profiles)) {
        const initialProfiles: Record<string, DogProfile> = {};
        MOCK_USERS.forEach(user => {
            const mainDog = user.dogs[0];
            initialProfiles[user.friendCode] = {
                dogName: mainDog.name,
                tags: mainDog.tags,
                avatarEmoji: mainDog.avatarEmoji,
                // Initial demo photo could be empty or a placeholder dataURL if we had one
            };
        });
        save(KEYS.profiles, initialProfiles);
    }

    // Seed some plans if none exist
    if (!localStorage.getItem(KEYS.plans)) {
        const today = todayString();
        const plans: Plan[] = [
            {
                id: "plan-seed-1",
                parkId: "park-1",
                creatorId: "user-2",
                date: today,
                timeSlot: "morning",
                status: "tentative",
                note: "一緒に行きましょー！",
                participantIds: ["user-2"],
                createdAt: new Date().toISOString(),
            },
            {
                id: "plan-seed-2",
                parkId: "park-1",
                creatorId: "user-3",
                date: today,
                timeSlot: "afternoon",
                status: "confirmed",
                note: "はなと行きます！",
                participantIds: ["user-3"],
                createdAt: new Date().toISOString(),
            },
            {
                id: "plan-seed-3",
                parkId: "park-2",
                creatorId: "user-2",
                date: today,
                timeSlot: "evening",
                status: "tentative",
                note: "",
                participantIds: ["user-2", "user-3"],
                createdAt: new Date().toISOString(),
            },
        ];
        save(KEYS.plans, plans);
        // Seed friend relations (user-demo is friends with user-2 and user-3)
        const reqs: FriendRequest[] = [
            {
                id: "fr-1",
                fromId: DEMO_USER_ID,
                toId: "user-2",
                status: "accepted",
                createdAt: new Date().toISOString(),
            },
            {
                id: "fr-2",
                fromId: DEMO_USER_ID,
                toId: "user-3",
                status: "accepted",
                createdAt: new Date().toISOString(),
            },
        ];
        save(KEYS.friendRequests, reqs);
    }
}

