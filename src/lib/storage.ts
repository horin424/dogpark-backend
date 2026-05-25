"use client";
import {
    collection,
    doc,
    deleteDoc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    writeBatch,
} from "firebase/firestore";
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import {
    Plan,
    Message,
    FriendRequest,
    Notification,
    User,
    AppEvent,
    EventType,
    PlanStatus,
} from "@/types";
import { MOCK_USERS, DEMO_USER_ID, INVITE_TOKENS } from "@/data/mockData";
import { db, storage, ensureAnonAuth } from "@/lib/firebase";
import { hashPin } from "@/lib/hash";

const SESSION_KEY = "wan_currentUserId";

export interface DogProfile {
    dogName: string;
    photoUrl?: string; // Firebase Storage download URL (was photoDataUrl in localStorage version)
    tags: string[];
    avatarEmoji: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) out[k] = v;
    }
    return out;
}

// ─── Session (localStorage only — current user id) ──────────────────────
export function getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(SESSION_KEY);
    } catch {
        return null;
    }
}

export function login(userId: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(SESSION_KEY, userId);
}

export function logout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
    return getCurrentUserId() !== null;
}

// ─── In-memory caches (sync getters used in render) ─────────────────────
const usersCache: Record<string, User> = {};
const profilesCache: Record<string, DogProfile | null> = {};

// Snapshot caches for instant re-renders on navigation. These hold the most
// recent successful response per (page, userId) so a re-mount can paint
// immediately while a fresh fetch reconciles in the background.
const notificationsSnapshot: Record<string, Notification[]> = {};
const friendIdsSnapshot: Record<string, string[]> = {};
const friendRequestsSnapshot: Record<string, FriendRequest[]> = {};
const activePlansSnapshot: { value: Plan[] | null } = { value: null };

export function getCachedNotifications(userId: string): Notification[] | undefined {
    return notificationsSnapshot[userId];
}
export function setCachedNotifications(userId: string, list: Notification[]): void {
    notificationsSnapshot[userId] = list;
}
export function getCachedFriendIds(userId: string): string[] | undefined {
    return friendIdsSnapshot[userId];
}
export function setCachedFriendIds(userId: string, ids: string[]): void {
    friendIdsSnapshot[userId] = ids;
}
export function getCachedFriendRequests(userId: string): FriendRequest[] | undefined {
    return friendRequestsSnapshot[userId];
}
export function setCachedFriendRequests(userId: string, reqs: FriendRequest[]): void {
    friendRequestsSnapshot[userId] = reqs;
}
export function getCachedActivePlans(): Plan[] | undefined {
    return activePlansSnapshot.value ?? undefined;
}
export function setCachedActivePlans(plans: Plan[]): void {
    activePlansSnapshot.value = plans;
}

/** Sync lookup; returns undefined until preloadUsers() has populated cache. */
export function getUserById(id: string): User | undefined {
    return usersCache[id];
}

/** Sync lookup; returns undefined until preloadProfiles()/fetchProfileByFriendCode() has populated cache. */
export function getProfileByFriendCode(friendCode: string): DogProfile | undefined {
    return profilesCache[friendCode] ?? undefined;
}

// ─── Auth ───────────────────────────────────────────────────────────────
/** Returns userId on success, null on failure. */
export async function loginWithPassword(
    accountId: string,
    password: string,
): Promise<string | null> {
    await ensureAnonAuth();
    const id = accountId.trim().toLowerCase();
    const q = query(
        collection(db(), "users"),
        where("accountIdLower", "==", id),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const userDoc = snap.docs[0];
    const data = userDoc.data() as { passwordHash?: string };
    const expected = await hashPin(password, id);
    if (data.passwordHash !== expected) return null;
    login(userDoc.id);
    return userDoc.id;
}

function normalizeInviteCode(token: string): string {
    return token.trim().toUpperCase();
}

export async function isValidInviteToken(token: string): Promise<boolean> {
    const code = normalizeInviteCode(token);
    if (!code) return false;
    if (INVITE_TOKENS.includes(code)) return true;
    try {
        await ensureAnonAuth();
        const snap = await getDoc(doc(db(), "invites", code));
        if (!snap.exists()) return false;
        const data = snap.data() as { revoked?: boolean };
        return data.revoked !== true;
    } catch {
        return false;
    }
}

export interface InviteRecord {
    code: string;
    createdAt: string;
    createdBy?: string;
    revoked: boolean;
    note?: string;
    builtIn: boolean;
}

function randomInviteCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `WAN-${out}`;
}

export async function listInvites(): Promise<InviteRecord[]> {
    await ensureAnonAuth();
    const snap = await getDocs(collection(db(), "invites"));
    const dynamic: InviteRecord[] = snap.docs.map((d) => {
        const data = d.data() as Partial<InviteRecord>;
        return {
            code: d.id,
            createdAt: data.createdAt ?? "",
            createdBy: data.createdBy,
            revoked: data.revoked === true,
            note: data.note,
            builtIn: false,
        };
    });
    const builtIn: InviteRecord[] = INVITE_TOKENS.map((code) => ({
        code,
        createdAt: "",
        revoked: false,
        builtIn: true,
    }));
    return [...builtIn, ...dynamic.sort((a, b) => b.createdAt.localeCompare(a.createdAt))];
}

export async function createInvite(opts: {
    code?: string;
    note?: string;
    createdBy?: string;
}): Promise<{ ok: true; code: string } | { ok: false; error: "taken" | "bad_input" }> {
    await ensureAnonAuth();
    let code = opts.code ? normalizeInviteCode(opts.code) : "";
    if (opts.code) {
        if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(code)) return { ok: false, error: "bad_input" };
        if (INVITE_TOKENS.includes(code)) return { ok: false, error: "taken" };
        const existing = await getDoc(doc(db(), "invites", code));
        if (existing.exists()) return { ok: false, error: "taken" };
    } else {
        for (let i = 0; i < 8; i++) {
            const candidate = randomInviteCode();
            const existing = await getDoc(doc(db(), "invites", candidate));
            if (!existing.exists()) {
                code = candidate;
                break;
            }
        }
        if (!code) return { ok: false, error: "taken" };
    }
    await setDoc(
        doc(db(), "invites", code),
        stripUndefined({
            createdAt: new Date().toISOString(),
            createdBy: opts.createdBy,
            note: opts.note?.trim() || undefined,
            revoked: false,
        }),
    );
    return { ok: true, code };
}

export async function revokeInvite(code: string): Promise<void> {
    await ensureAnonAuth();
    await updateDoc(doc(db(), "invites", normalizeInviteCode(code)), { revoked: true });
}

export async function unrevokeInvite(code: string): Promise<void> {
    await ensureAnonAuth();
    await updateDoc(doc(db(), "invites", normalizeInviteCode(code)), { revoked: false });
}

const FRIEND_CODE_PREFIXES = ["WOOF", "BARK", "PAW"];

function randomFriendCode(): string {
    const prefix =
        FRIEND_CODE_PREFIXES[Math.floor(Math.random() * FRIEND_CODE_PREFIXES.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}`;
}

async function generateUniqueFriendCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const code = randomFriendCode();
        const q = query(
            collection(db(), "users"),
            where("friendCode", "==", code),
        );
        const snap = await getDocs(q);
        if (snap.empty) return code;
    }
    // Extremely unlikely; fall back to a longer random suffix.
    return `${FRIEND_CODE_PREFIXES[0]}-${Date.now().toString().slice(-6)}`;
}

export interface SignupInput {
    accountId: string;
    password: string;
    displayName: string;
    dogName: string;
    avatarEmoji: string;
    inviteToken: string;
}

export type SignupResult =
    | { ok: true; userId: string }
    | { ok: false; error: "invalid_invite" | "id_taken" | "weak_password" | "bad_input" };

export async function signupWithPassword(input: SignupInput): Promise<SignupResult> {
    if (!(await isValidInviteToken(input.inviteToken))) return { ok: false, error: "invalid_invite" };
    const accountId = input.accountId.trim();
    const password = input.password;
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(accountId)) return { ok: false, error: "bad_input" };
    if (password.length < 6) return { ok: false, error: "weak_password" };
    if (!input.displayName.trim() || !input.dogName.trim()) return { ok: false, error: "bad_input" };

    await ensureAnonAuth();
    const idLower = accountId.toLowerCase();
    const exists = await getDocs(
        query(collection(db(), "users"), where("accountIdLower", "==", idLower)),
    );
    if (!exists.empty) return { ok: false, error: "id_taken" };

    const friendCode = await generateUniqueFriendCode();
    const passwordHash = await hashPin(password, idLower);
    const userId = generateId();
    const dogId = generateId();

    await setDoc(doc(db(), "users", userId), {
        displayName: input.displayName.trim(),
        accountId,
        accountIdLower: idLower,
        friendCode,
        friendCodeLower: friendCode.toLowerCase(),
        passwordHash,
        dogs: [
            {
                id: dogId,
                name: input.dogName.trim(),
                size: "small",
                tags: [],
                avatarEmoji: input.avatarEmoji || "🐕",
            },
        ],
    });

    await setDoc(doc(db(), "profiles", friendCode), {
        dogName: input.dogName.trim(),
        tags: [],
        avatarEmoji: input.avatarEmoji || "🐕",
    });

    login(userId);
    return { ok: true, userId };
}

// ─── Users ──────────────────────────────────────────────────────────────
function userFromDoc(id: string, data: Record<string, unknown>): User {
    return {
        id,
        displayName: (data.displayName as string) ?? "",
        accountId: (data.accountId as string) ?? "",
        friendCode: (data.friendCode as string) ?? "",
        dogs: (data.dogs as User["dogs"]) ?? [],
    };
}

export async function getUsers(): Promise<User[]> {
    await ensureAnonAuth();
    const snap = await getDocs(collection(db(), "users"));
    const users = snap.docs.map((d) =>
        userFromDoc(d.id, d.data() as Record<string, unknown>),
    );
    for (const u of users) usersCache[u.id] = u;
    return users;
}

/** Populate the users cache so getUserById() works in render. */
export async function preloadUsers(): Promise<void> {
    await getUsers();
}

export async function getCurrentUser(): Promise<User | null> {
    const id = getCurrentUserId();
    if (!id) return null;
    if (usersCache[id]) return usersCache[id];
    await ensureAnonAuth();
    const snap = await getDoc(doc(db(), "users", id));
    if (!snap.exists()) return null;
    const u = userFromDoc(snap.id, snap.data() as Record<string, unknown>);
    usersCache[u.id] = u;
    return u;
}

export async function saveUserDogs(
    userId: string,
    dogs: User["dogs"],
): Promise<void> {
    await ensureAnonAuth();
    await updateDoc(doc(db(), "users", userId), { dogs });
    if (usersCache[userId]) usersCache[userId] = { ...usersCache[userId], dogs };
}

export async function saveUserDisplayName(
    userId: string,
    displayName: string,
): Promise<void> {
    await ensureAnonAuth();
    const name = displayName.trim();
    await updateDoc(doc(db(), "users", userId), { displayName: name });
    if (usersCache[userId]) {
        usersCache[userId] = { ...usersCache[userId], displayName: name };
    }
}

// ─── Plans ──────────────────────────────────────────────────────────────
function planFromDoc(id: string, d: Record<string, unknown>): Plan {
    return {
        id,
        parkId: d.parkId as string,
        creatorId: d.creatorId as string,
        date: d.date as string,
        timeSlot: d.timeSlot as Plan["timeSlot"],
        status: d.status as Plan["status"],
        note: (d.note as string) ?? "",
        participantIds: (d.participantIds as string[]) ?? [],
        createdAt: (d.createdAt as string) ?? new Date().toISOString(),
        isAnonymous: d.isAnonymous as boolean | undefined,
    };
}

export async function getPlans(): Promise<Plan[]> {
    await ensureAnonAuth();
    const snap = await getDocs(collection(db(), "plans"));
    return snap.docs.map((d) =>
        planFromDoc(d.id, d.data() as Record<string, unknown>),
    );
}

export async function getPlanById(id: string): Promise<Plan | undefined> {
    await ensureAnonAuth();
    const snap = await getDoc(doc(db(), "plans", id));
    if (!snap.exists()) return undefined;
    return planFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function addPlan(plan: Plan): Promise<void> {
    await ensureAnonAuth();
    const { id, ...rest } = plan;
    await setDoc(doc(db(), "plans", id), stripUndefined(rest));
}

export async function updatePlan(updated: Plan): Promise<void> {
    await ensureAnonAuth();
    const { id, ...rest } = updated;
    await updateDoc(doc(db(), "plans", id), stripUndefined(rest));
}

export async function deletePlan(planId: string): Promise<void> {
    await ensureAnonAuth();
    // Best-effort cleanup of the messages subcollection so the chat history
    // doesn't linger after deletion. If it fails, the plan doc still gets
    // removed below.
    try {
        const msgs = await getDocs(collection(db(), "plans", planId, "messages"));
        if (!msgs.empty) {
            const batch = writeBatch(db());
            msgs.docs.forEach((m) => batch.delete(m.ref));
            await batch.commit();
        }
    } catch (err) {
        console.error("delete messages failed", err);
    }
    await deleteDoc(doc(db(), "plans", planId));
}

export async function getActivePlans(): Promise<Plan[]> {
    await ensureAnonAuth();
    const today = todayString();
    const q = query(collection(db(), "plans"), where("date", ">=", today));
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
        planFromDoc(d.id, d.data() as Record<string, unknown>),
    );
}

export async function getTodayPlans(): Promise<Plan[]> {
    return getPlansByDate(todayString());
}

export async function getPlansByDate(date: string): Promise<Plan[]> {
    await ensureAnonAuth();
    const q = query(collection(db(), "plans"), where("date", "==", date));
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
        planFromDoc(d.id, d.data() as Record<string, unknown>),
    );
}

export function todayString(): string {
    // Local-date YYYY-MM-DD. toISOString() returns UTC, which silently rolls
    // the date back in JST/early-morning timezones and made "today" show
    // yesterday's plans.
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// ─── Messages (subcollection plans/{planId}/messages) ───────────────────
function messageFromDoc(id: string, d: Record<string, unknown>): Message {
    return {
        id,
        planId: d.planId as string,
        senderId: d.senderId as string,
        text: d.text as string,
        createdAt: d.createdAt as string,
        isSystem: d.isSystem as boolean | undefined,
    };
}

export async function getMessagesByPlan(planId: string): Promise<Message[]> {
    await ensureAnonAuth();
    const q = query(
        collection(db(), "plans", planId, "messages"),
        orderBy("createdAt", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
        messageFromDoc(d.id, d.data() as Record<string, unknown>),
    );
}

export async function addMessage(msg: Message): Promise<void> {
    await ensureAnonAuth();
    const { id, planId, ...rest } = msg;
    await setDoc(
        doc(db(), "plans", planId, "messages", id),
        stripUndefined({ planId, ...rest }),
    );
}

// ─── Friend Requests ────────────────────────────────────────────────────
function frFromDoc(id: string, d: Record<string, unknown>): FriendRequest {
    return {
        id,
        fromId: d.fromId as string,
        toId: d.toId as string,
        status: d.status as FriendRequest["status"],
        createdAt: d.createdAt as string,
    };
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
    await ensureAnonAuth();
    const snap = await getDocs(collection(db(), "friendRequests"));
    return snap.docs.map((d) =>
        frFromDoc(d.id, d.data() as Record<string, unknown>),
    );
}

export async function addFriendRequest(req: FriendRequest): Promise<void> {
    await ensureAnonAuth();
    const { id, ...rest } = req;
    await setDoc(doc(db(), "friendRequests", id), stripUndefined(rest));
}

export async function updateFriendRequest(
    updated: FriendRequest,
): Promise<void> {
    await ensureAnonAuth();
    const { id, ...rest } = updated;
    await updateDoc(doc(db(), "friendRequests", id), stripUndefined(rest));
}

export async function getFriendIds(userId: string): Promise<string[]> {
    await ensureAnonAuth();
    const fromQ = query(
        collection(db(), "friendRequests"),
        where("fromId", "==", userId),
        where("status", "==", "accepted"),
    );
    const toQ = query(
        collection(db(), "friendRequests"),
        where("toId", "==", userId),
        where("status", "==", "accepted"),
    );
    const [fromSnap, toSnap] = await Promise.all([getDocs(fromQ), getDocs(toQ)]);
    const ids = new Set<string>();
    fromSnap.docs.forEach((d) => ids.add((d.data() as { toId: string }).toId));
    toSnap.docs.forEach((d) => ids.add((d.data() as { fromId: string }).fromId));
    return Array.from(ids);
}

// ─── Notifications ──────────────────────────────────────────────────────
function notifFromDoc(id: string, d: Record<string, unknown>): Notification {
    return {
        id,
        userId: d.userId as string,
        type: d.type as Notification["type"],
        title: d.title as string,
        body: d.body as string,
        planId: d.planId as string | undefined,
        friendId: d.friendId as string | undefined,
        isRead: (d.isRead as boolean) ?? false,
        createdAt: d.createdAt as string,
    };
}

/** Returns notifications for the given user, sorted newest first. */
export async function getNotifications(userId: string): Promise<Notification[]> {
    await ensureAnonAuth();
    const q = query(
        collection(db(), "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
        notifFromDoc(d.id, d.data() as Record<string, unknown>),
    );
}

export async function addNotification(notif: Notification): Promise<void> {
    await ensureAnonAuth();
    const { id, ...rest } = notif;
    await setDoc(doc(db(), "notifications", id), stripUndefined(rest));
}

export async function markNotificationRead(id: string): Promise<void> {
    await ensureAnonAuth();
    await updateDoc(doc(db(), "notifications", id), { isRead: true });
}

export async function getUnreadCount(userId: string): Promise<number> {
    await ensureAnonAuth();
    const q = query(
        collection(db(), "notifications"),
        where("userId", "==", userId),
        where("isRead", "==", false),
    );
    const snap = await getDocs(q);
    return snap.size;
}

// ─── Events (MVP analytics) ─────────────────────────────────────────────
function eventFromDoc(id: string, d: Record<string, unknown>): AppEvent {
    return {
        id,
        type: d.type as EventType,
        userId: d.userId as string,
        planId: d.planId as string | undefined,
        parkId: d.parkId as string | undefined,
        fromStatus: d.fromStatus as PlanStatus | undefined,
        toStatus: d.toStatus as PlanStatus | undefined,
        participantCount: d.participantCount as number | undefined,
        createdAt: d.createdAt as string,
    };
}

export async function logEvent(
    event: Omit<AppEvent, "id" | "createdAt"> & { createdAt?: string },
): Promise<void> {
    try {
        await ensureAnonAuth();
        const id = generateId();
        const payload = stripUndefined({
            ...event,
            createdAt: event.createdAt ?? new Date().toISOString(),
        });
        await setDoc(doc(db(), "events", id), payload);
    } catch (err) {
        // Logging must never break the user flow.
        console.error("logEvent failed", err);
    }
}

export async function getEvents(limit = 200): Promise<AppEvent[]> {
    await ensureAnonAuth();
    const q = query(collection(db(), "events"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs
        .slice(0, limit)
        .map((d) => eventFromDoc(d.id, d.data() as Record<string, unknown>));
}

// ─── Profiles ───────────────────────────────────────────────────────────
export async function preloadProfiles(): Promise<void> {
    await ensureAnonAuth();
    const snap = await getDocs(collection(db(), "profiles"));
    for (const d of snap.docs) {
        profilesCache[d.id] = d.data() as DogProfile;
    }
}

export async function getProfiles(): Promise<Record<string, DogProfile>> {
    await ensureAnonAuth();
    const snap = await getDocs(collection(db(), "profiles"));
    const out: Record<string, DogProfile> = {};
    for (const d of snap.docs) {
        out[d.id] = d.data() as DogProfile;
        profilesCache[d.id] = out[d.id];
    }
    return out;
}

/** Async profile fetch with cache. Use this in components like DogAvatar. */
export async function fetchProfileByFriendCode(
    friendCode: string,
): Promise<DogProfile | undefined> {
    if (friendCode in profilesCache) {
        return profilesCache[friendCode] ?? undefined;
    }
    await ensureAnonAuth();
    const snap = await getDoc(doc(db(), "profiles", friendCode));
    const p = snap.exists() ? (snap.data() as DogProfile) : null;
    profilesCache[friendCode] = p;
    return p ?? undefined;
}

export async function updateProfile(
    friendCode: string,
    profile: Partial<DogProfile>,
): Promise<void> {
    await ensureAnonAuth();
    const ref = doc(db(), "profiles", friendCode);
    const existing = await getDoc(ref);
    const base: DogProfile = existing.exists()
        ? (existing.data() as DogProfile)
        : { dogName: "", tags: [], avatarEmoji: "🐕" };
    // Strip undefined from the partial first so unspecified fields don't clobber existing values.
    const cleanProfile = stripUndefined(profile as Record<string, unknown>);
    const merged = { ...base, ...cleanProfile } as DogProfile;
    await setDoc(ref, merged as unknown as Record<string, unknown>);
    profilesCache[friendCode] = merged;
}

// ─── Photo upload (Firebase Storage) ────────────────────────────────────
/** Uploads a dog photo and returns the public download URL. */
export async function uploadDogPhoto(
    ownerKey: string,
    file: Blob,
): Promise<string> {
    await ensureAnonAuth();
    const path = `profiles/${ownerKey}/main_${Date.now()}`;
    const ref = storageRef(storage(), path);
    await uploadBytes(ref, file);
    return await getDownloadURL(ref);
}

// ─── Utility ────────────────────────────────────────────────────────────
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

// ─── Seed (one-time, idempotent on user-demo doc) ───────────────────────
let seedPromise: Promise<void> | null = null;

export async function seedDemoData(): Promise<void> {
    if (seedPromise) return seedPromise;
    seedPromise = (async () => {
        await ensureAnonAuth();
        const probe = await getDoc(doc(db(), "users", DEMO_USER_ID));
        // Skip seed only if already migrated to accountId-based auth.
        // (Old PIN-only docs get re-seeded so demo logins keep working.)
        if (probe.exists() && (probe.data() as { accountIdLower?: string }).accountIdLower) {
            return;
        }

        const usersWithHash = await Promise.all(
            MOCK_USERS.map(async (u) => {
                const idLower = u.accountId.toLowerCase();
                return {
                    u,
                    code: u.friendCode.toLowerCase(),
                    idLower,
                    passwordHash: await hashPin(u.password!, idLower),
                };
            }),
        );

        const batch = writeBatch(db());

        for (const { u, code, idLower, passwordHash } of usersWithHash) {
            batch.set(doc(db(), "users", u.id), {
                displayName: u.displayName,
                accountId: u.accountId,
                accountIdLower: idLower,
                friendCode: u.friendCode,
                friendCodeLower: code,
                passwordHash,
                dogs: u.dogs,
            });
            const mainDog = u.dogs[0];
            batch.set(doc(db(), "profiles", u.friendCode), {
                dogName: mainDog.name,
                tags: mainDog.tags,
                avatarEmoji: mainDog.avatarEmoji,
            });
        }

        const today = todayString();
        const seedPlans: Plan[] = [
            {
                id: "plan-seed-1",
                parkId: "tochigi_01",
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
                parkId: "tochigi_01",
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
                parkId: "tochigi_03",
                creatorId: "user-2",
                date: today,
                timeSlot: "evening",
                status: "tentative",
                note: "",
                participantIds: ["user-2", "user-3"],
                createdAt: new Date().toISOString(),
            },
        ];
        for (const p of seedPlans) {
            const { id, ...rest } = p;
            batch.set(doc(db(), "plans", id), stripUndefined(rest));
        }

        batch.set(doc(db(), "friendRequests", "fr-1"), {
            fromId: DEMO_USER_ID,
            toId: "user-2",
            status: "accepted",
            createdAt: new Date().toISOString(),
        });
        batch.set(doc(db(), "friendRequests", "fr-2"), {
            fromId: DEMO_USER_ID,
            toId: "user-3",
            status: "accepted",
            createdAt: new Date().toISOString(),
        });

        await batch.commit();
    })().catch((err) => {
        seedPromise = null;
        throw err;
    });
    return seedPromise;
}
