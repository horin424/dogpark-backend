"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    getCurrentUserId,
    getFriendRequests,
    addFriendRequest,
    updateFriendRequest,
    getUsers,
<<<<<<< HEAD
=======
    saveFriendRequests,
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    getFriendIds,
    getUserById,
    addNotification,
    generateId,
<<<<<<< HEAD
    preloadProfiles,
    getCachedFriendIds,
    setCachedFriendIds,
    getCachedFriendRequests,
    setCachedFriendRequests,
=======
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
} from "@/lib/storage";
import { FriendRequest, User } from "@/types";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import DogAvatar from "@/components/DogAvatar";
<<<<<<< HEAD
import { SkeletonList } from "@/components/Skeleton";
=======
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde


export default function FriendsPage() {
    const router = useRouter();
    const { showToast, ToastElement } = useToast();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tab, setTab] = useState<"friends" | "requests">("friends");
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [incomingReqs, setIncomingReqs] = useState<FriendRequest[]>([]);
    const [outgoingReqs, setOutgoingReqs] = useState<FriendRequest[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [inputCode, setInputCode] = useState("");
    const [copied, setCopied] = useState(false);
<<<<<<< HEAD
    const [submitting, setSubmitting] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(async () => {
=======

    const load = useCallback(() => {
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
        const uid = getCurrentUserId();
        if (!uid) {
            router.replace("/login?next=/friends");
            return;
        }
        setCurrentUserId(uid);
<<<<<<< HEAD

        const cachedIds = getCachedFriendIds(uid);
        const cachedReqs = getCachedFriendRequests(uid);
        if (cachedIds) setFriendIds(cachedIds);
        if (cachedReqs) {
            setIncomingReqs(cachedReqs.filter((r) => r.toId === uid && r.status === "pending"));
            setOutgoingReqs(cachedReqs.filter((r) => r.fromId === uid && r.status === "pending"));
        }
        if (cachedIds || cachedReqs) setLoaded(true);

        try {
            const [users, reqs, ids] = await Promise.all([
                getUsers(),
                getFriendRequests(),
                getFriendIds(uid),
                preloadProfiles(),
            ]);
            setCurrentUser(users.find((u) => u.id === uid) ?? null);
            setFriendIds(ids);
            setCachedFriendIds(uid, ids);
            setCachedFriendRequests(uid, reqs);
            setIncomingReqs(
                reqs.filter((r) => r.toId === uid && r.status === "pending"),
            );
            setOutgoingReqs(
                reqs.filter((r) => r.fromId === uid && r.status === "pending"),
            );
        } catch (err) {
            console.error("load friends failed", err);
        } finally {
            setLoaded(true);
        }
=======
        const users = getUsers();
        setCurrentUser(users.find((u) => u.id === uid) ?? null);
        setFriendIds(getFriendIds(uid));
        const reqs = getFriendRequests();
        setIncomingReqs(
            reqs.filter((r) => r.toId === uid && r.status === "pending")
        );
        setOutgoingReqs(
            reqs.filter((r) => r.fromId === uid && r.status === "pending")
        );
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    }, [router]);

    useEffect(() => {
        load();
    }, [load]);

<<<<<<< HEAD
    const handleSendRequest = async () => {
        if (!currentUserId || !inputCode.trim() || submitting) return;
        setSubmitting(true);
        try {
            const users = await getUsers();
            const target = users.find(
                (u) => u.friendCode.toLowerCase() === inputCode.trim().toLowerCase(),
            );
            if (!target) {
                showToast("❌ 友達コードが見つかりません");
                return;
            }
            if (target.id === currentUserId) {
                showToast("自分自身には送れません");
                return;
            }
            if (friendIds.includes(target.id)) {
                showToast("すでにフレンドです");
                return;
            }
            const req: FriendRequest = {
                id: generateId(),
                fromId: currentUserId,
                toId: target.id,
                status: "pending",
                createdAt: new Date().toISOString(),
            };
            await addFriendRequest(req);
            await addNotification({
                id: generateId(),
                userId: target.id,
                type: "friend_request",
                title: "フレンド申請が届きました",
                body: `${currentUser?.displayName} からフレンド申請が届いています`,
                isRead: false,
                createdAt: new Date().toISOString(),
            });
            showToast("✉️ 申請を送信しました");
            setInputCode("");
            setShowAddModal(false);
            await load();
        } catch (err) {
            console.error(err);
            showToast("送信に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async (req: FriendRequest) => {
        if (!currentUserId) return;
        try {
            await updateFriendRequest({ ...req, status: "accepted" });
            const me = getUserById(currentUserId);
            const them = getUserById(req.fromId);
            await addNotification({
                id: generateId(),
                userId: req.fromId,
                type: "friend_accepted",
                title: "フレンド申請が承認されました",
                body: `${me?.displayName} とフレンドになりました！`,
                isRead: false,
                createdAt: new Date().toISOString(),
            });
            showToast(`🐶 ${them?.dogs[0]?.name} とフレンドになりました！`);
            await load();
        } catch (err) {
            console.error(err);
            showToast("承認に失敗しました");
        }
    };

    const handleReject = async (req: FriendRequest) => {
        try {
            await updateFriendRequest({ ...req, status: "rejected" });
            await load();
        } catch (err) {
            console.error(err);
            showToast("拒否に失敗しました");
        }
=======
    const handleSendRequest = () => {
        if (!currentUserId || !inputCode.trim()) return;
        const users = getUsers();
        const target = users.find(
            (u) => u.friendCode.toLowerCase() === inputCode.trim().toLowerCase()
        );
        if (!target) {
            showToast("❌ 友達コードが見つかりません");
            return;
        }
        if (target.id === currentUserId) {
            showToast("自分自身には送れません");
            return;
        }
        if (friendIds.includes(target.id)) {
            showToast("すでにフレンドです");
            return;
        }
        const req: FriendRequest = {
            id: generateId(),
            fromId: currentUserId,
            toId: target.id,
            status: "pending",
            createdAt: new Date().toISOString(),
        };
        addFriendRequest(req);
        addNotification({
            id: generateId(),
            userId: target.id,
            type: "friend_request",
            title: "フレンド申請が届きました",
            body: `${currentUser?.displayName} からフレンド申請が届いています`,
            isRead: false,
            createdAt: new Date().toISOString(),
        });
        showToast("✉️ 申請を送信しました");
        setInputCode("");
        setShowAddModal(false);
        load();
    };

    const handleAccept = (req: FriendRequest) => {
        updateFriendRequest({ ...req, status: "accepted" });
        const me = getUserById(currentUserId!);
        const them = getUserById(req.fromId);
        addNotification({
            id: generateId(),
            userId: req.fromId,
            type: "friend_accepted",
            title: "フレンド申請が承認されました",
            body: `${me?.displayName} とフレンドになりました！`,
            isRead: false,
            createdAt: new Date().toISOString(),
        });
        showToast(`🐶 ${them?.dogs[0]?.name} とフレンドになりました！`);
        load();
    };

    const handleReject = (req: FriendRequest) => {
        updateFriendRequest({ ...req, status: "rejected" });
        load();
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    };

    const copyCode = () => {
        if (!currentUser) return;
        navigator.clipboard.writeText(currentUser.friendCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

<<<<<<< HEAD
    if (!currentUserId && !loaded) {
        return (
            <div className="py-5 flex flex-col gap-5">
                <div className="h-6 w-32 bg-amber-100/70 rounded animate-pulse" />
                <div className="h-20 bg-amber-50 border border-amber-200 rounded-2xl animate-pulse" />
                <SkeletonList count={3} />
            </div>
        );
    }
=======
    if (!currentUserId) return null;
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde

    return (
        <div className="py-5 flex flex-col gap-5">
            {ToastElement}

            {/* Header + Add button */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">👥 フレンド</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                    ＋ 追加
                </button>
            </div>

            {/* My friend code */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-amber-600 font-medium">あなたの友達コード</p>
                    <p className="font-bold text-amber-800 text-lg tracking-wider mt-0.5">
                        {currentUser?.friendCode}
                    </p>
                </div>
                <button
                    onClick={copyCode}
                    className="text-amber-600 font-semibold text-sm border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                >
                    {copied ? "コピー済み！" : "コピー"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                {(["friends", "requests"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === t
                            ? "border-amber-500 text-amber-600"
                            : "border-transparent text-gray-400"
                            }`}
                    >
                        {t === "friends" ? `フレンド (${friendIds.length})` : `申請 (${incomingReqs.length})`}
                    </button>
                ))}
            </div>

            {/* Friends list */}
            {tab === "friends" && (
                <div className="flex flex-col gap-3">
                    {friendIds.length === 0 ? (
                        <EmptyState
                            emoji="🐕"
                            title="まだフレンドがいません"
                            description="友達コードでフレンドを追加しましょう"
                            action={
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold"
                                >
                                    ＋ 追加
                                </button>
                            }
                        />
                    ) : (
                        friendIds.map((fid) => {
                            const f = getUserById(fid);
                            return (
                                <div key={fid} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-3">
                                    <DogAvatar friendCode={f?.friendCode} size="md" />
                                    <div>

                                        <p className="font-semibold text-gray-800">{f?.displayName}</p>
                                        <p className="text-xs text-gray-400">
                                            {f?.dogs.map((d) => d.name).join(", ")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Requests tab */}
            {tab === "requests" && (
                <div className="flex flex-col gap-4">
                    {incomingReqs.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">受信</p>
                            {incomingReqs.map((req) => {
                                const from = getUserById(req.fromId);
                                return (
                                    <div key={req.id} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-3">
                                        <DogAvatar friendCode={from?.friendCode} size="md" />
                                        <div className="flex-1">

                                            <p className="font-semibold text-gray-800 text-sm">{from?.displayName}</p>
                                            <p className="text-xs text-gray-400">{from?.dogs[0]?.name}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAccept(req)}
                                            className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold mr-2"
                                        >
                                            承認
                                        </button>
                                        <button
                                            onClick={() => handleReject(req)}
                                            className="text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full text-xs"
                                        >
                                            拒否
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {outgoingReqs.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">送信中</p>
                            {outgoingReqs.map((req) => {
                                const to = getUserById(req.toId);
                                return (
                                    <div key={req.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 opacity-70">
                                        <DogAvatar friendCode={to?.friendCode} size="md" />
                                        <div className="flex-1">

                                            <p className="font-medium text-gray-700 text-sm">{to?.displayName}</p>
                                            <p className="text-xs text-gray-400">承認待ち…</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {incomingReqs.length === 0 && outgoingReqs.length === 0 && (
                        <EmptyState emoji="✉️" title="申請はありません" />
                    )}
                </div>
            )}

            {/* Add modal */}
            {showAddModal && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
                >
                    <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10">
                        <h2 className="font-bold text-gray-800 text-lg mb-4">フレンドを追加</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            相手の友達コードを入力してください
                        </p>
                        <input
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="例: BARK-5678"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-amber-400"
                        />
                        <button
                            onClick={handleSendRequest}
<<<<<<< HEAD
                            disabled={submitting}
                            className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "送信中…" : "申請を送る"}
=======
                            className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
                        >
                            申請を送る
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
                        </button>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="w-full mt-2 text-gray-500 py-2 text-sm"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
