"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    getPlanById,
    getUserById,
    getCurrentUserId,
    updatePlan,
    addMessage,
    getMessagesByPlan,
    addNotification,
    getFriendIds,
    generateId,
    timeSlotLabel,
    timeSlotEmoji,
    statusLabel,
    todayString,
} from "@/lib/storage";
import { MOCK_PARKS } from "@/data/mockData";
import { Plan, Message, PlanStatus } from "@/types";
import { useToast } from "@/components/Toast";
import DogAvatar from "@/components/DogAvatar";


export default function PlanDetailPage() {
    const params = useParams();
    const planId = params?.planId as string;
    const router = useRouter();
    const { showToast, ToastElement } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [plan, setPlan] = useState<Plan | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [newMsg, setNewMsg] = useState("");
    const [isArchived, setIsArchived] = useState(false);

    const loadData = useCallback(() => {
        const uid = getCurrentUserId();
        setCurrentUserId(uid);
        const p = getPlanById(planId);
        if (p) {
            setPlan(p);
            const today = todayString();
            setIsArchived(p.date < today);
        }
        setMessages(getMessagesByPlan(planId));
    }, [planId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!plan) {
        return <div className="py-10 text-center text-gray-400">予定が見つかりません</div>;
    }

    const park = MOCK_PARKS.find((p) => p.id === plan.parkId);
    const creator = getUserById(plan.creatorId);
    const isCreator = currentUserId === plan.creatorId;
    const isParticipating = currentUserId ? plan.participantIds.includes(currentUserId) : false;

    const handleJoin = () => {
        if (!currentUserId) {
            router.push(`/login?next=/plans/${planId}`);
            return;
        }
        if (isParticipating) return;
        const updated: Plan = {
            ...plan,
            participantIds: [...plan.participantIds, currentUserId],
        };
        updatePlan(updated);
        const me = getUserById(currentUserId);
        const sysMsg: Message = {
            id: generateId(),
            planId,
            senderId: "system",
            text: `${me?.displayName ?? "あなた"} が参加しました！🐾`,
            createdAt: new Date().toISOString(),
            isSystem: true,
        };
        addMessage(sysMsg);
        addNotification({
            id: generateId(),
            userId: plan.creatorId,
            type: "plan_join",
            title: "参加者が増えました！",
            body: `${me?.displayName} が参加しました`,
            planId,
            isRead: false,
            createdAt: new Date().toISOString(),
        });
        showToast("✅ 参加しました！");
        loadData();
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    };

    const handleStatusChange = (newStatus: PlanStatus) => {
        if (!isCreator) return;
        const updated: Plan = { ...plan, status: newStatus };
        updatePlan(updated);
        const sysMsg: Message = {
            id: generateId(),
            planId,
            senderId: "system",
            text: newStatus === "confirmed"
                ? `🎉 予定が確定しました！`
                : `📝 予定が迷い中に戻りました`,
            createdAt: new Date().toISOString(),
            isSystem: true,
        };
        addMessage(sysMsg);
        if (newStatus === "confirmed") {
            showToast("🎉 予定が確定しました！");
            // Notify all friends
            getFriendIds(plan.creatorId).forEach((fId) => {
                addNotification({
                    id: generateId(),
                    userId: fId,
                    type: "plan_confirmed",
                    title: "予定が確定しました！",
                    body: `${creator?.displayName} の ${park?.name} (${timeSlotLabel(plan.timeSlot)}) が確定`,
                    planId,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                });
            });
        }
        setPlan(updated);
        loadData();
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId || !newMsg.trim() || isArchived) return;
        const msg: Message = {
            id: generateId(),
            planId,
            senderId: currentUserId,
            text: newMsg.trim(),
            createdAt: new Date().toISOString(),
        };
        addMessage(msg);
        setNewMsg("");
        loadData();
    };

    return (
        <div className="py-5 flex flex-col gap-5">
            {ToastElement}

            {/* Summary card */}
            <div className={`rounded-2xl p-5 border shadow-sm ${plan.status === "tentative" ? "bg-yellow-50 border-yellow-200" : "bg-white border-amber-100"}`}>
                <div className="flex items-center gap-3 mb-3">
                    <DogAvatar friendCode={creator?.friendCode} size="lg" />
                    <div>
                        <p className="font-bold text-gray-800">{creator?.dogs[0]?.name}</p>
                        <p className="text-xs text-gray-400">{creator?.displayName} のプラン</p>
                    </div>

                    <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${plan.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-200 text-yellow-800"}`}>
                        {statusLabel(plan.status)}
                    </span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <p>📍 {park?.name ?? "不明"}</p>
                    <p>{timeSlotEmoji(plan.timeSlot)} {timeSlotLabel(plan.timeSlot)}  ·  📅 {plan.date}</p>
                    {plan.note && <p className="text-gray-500 mt-1 italic">"{plan.note}"</p>}
                </div>

                {/* Status change (creator only) */}
                {isCreator && !isArchived && (
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => handleStatusChange(plan.status === "confirmed" ? "tentative" : "confirmed")}
                            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${plan.status === "confirmed"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                : "bg-green-100 text-green-700 border border-green-300"
                                }`}
                        >
                            {plan.status === "confirmed" ? "迷い中に戻す" : "✅ 確定にする"}
                        </button>
                    </div>
                )}
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                <h2 className="font-bold text-gray-700 text-sm mb-3">
                    参加者 ({plan.participantIds.length})
                </h2>
                <div className="flex gap-2 flex-wrap">
                    {plan.participantIds.map((uid) => {
                        const u = getUserById(uid);
                        return (
                            <div key={uid} className="flex flex-col items-center gap-1">
                                <DogAvatar friendCode={u?.friendCode} size="md" />
                                <span className="text-xs text-gray-500">{u?.dogs[0]?.name ?? "不明"}</span>
                            </div>
                        );

                    })}
                </div>
                {!isParticipating && currentUserId && !isArchived && (
                    <button
                        onClick={handleJoin}
                        className="mt-4 w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
                    >
                        {plan.status === "tentative" ? "一緒に行くよ" : "同じ時間に行く"}
                    </button>
                )}
                {!currentUserId && (
                    <Link
                        href={`/login?next=/plans/${planId}`}
                        className="mt-4 block w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-amber-600 transition-colors"
                    >
                        ログインして参加する
                    </Link>
                )}
                {isArchived && (
                    <p className="mt-2 text-xs text-gray-400 text-center">過去の予定はアーカイブ済みです</p>
                )}
            </div>

            {/* Chat */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-50">
                    <h2 className="font-bold text-gray-700 text-sm">💬 チャット</h2>
                </div>
                <div className="p-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-300 text-xs py-4">まだメッセージがありません</p>
                    )}
                    {messages.map((msg) => {
                        const sender = getUserById(msg.senderId);
                        const isMe = msg.senderId === currentUserId;
                        if (msg.isSystem) {
                            return (
                                <div key={msg.id} className="text-center text-xs text-gray-400 py-1">
                                    — {msg.text} —
                                </div>
                            );
                        }
                        return (
                            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                <DogAvatar friendCode={sender?.friendCode} size="sm" />
                                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>

                                    {!isMe && <p className="text-xs text-gray-400 mb-0.5">{sender?.dogs[0]?.name}</p>}
                                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
                {/* Input */}
                {!isArchived && currentUserId && (
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-amber-50 flex gap-2">
                        <input
                            value={newMsg}
                            onChange={(e) => setNewMsg(e.target.value)}
                            placeholder="メッセージを入力..."
                            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-amber-400"
                        />
                        <button
                            type="submit"
                            disabled={!newMsg.trim()}
                            className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-40 hover:bg-amber-600 transition-colors"
                        >
                            送信
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
