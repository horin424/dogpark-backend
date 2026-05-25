"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
=======
import Link from "next/link";
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
import {
    getCurrentUserId,
    getNotifications,
    markNotificationRead,
<<<<<<< HEAD
    getCachedNotifications,
    setCachedNotifications,
} from "@/lib/storage";
import { usePolling } from "@/lib/hooks";
import { Notification } from "@/types";
import EmptyState from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";
=======
} from "@/lib/storage";
import { Notification } from "@/types";
import EmptyState from "@/components/EmptyState";
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
<<<<<<< HEAD
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(async () => {
=======
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const load = useCallback(() => {
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
        const uid = getCurrentUserId();
        if (!uid) {
            router.replace("/login?next=/notifications");
            return;
        }
<<<<<<< HEAD
        const cached = getCachedNotifications(uid);
        if (cached) {
            setNotifications(cached);
            setLoaded(true);
        }
        try {
            const list = await getNotifications(uid);
            setNotifications(list);
            setCachedNotifications(uid, list);
        } catch (err) {
            console.error("load notifications failed", err);
        } finally {
            setLoaded(true);
        }
=======
        setCurrentUserId(uid);
        setNotifications(
            getNotifications()
                .filter((n) => n.userId === uid)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    }, [router]);

    useEffect(() => {
        load();
    }, [load]);

<<<<<<< HEAD
    usePolling(load, 20000);

    const handleTap = async (notif: Notification) => {
        try {
            await markNotificationRead(notif.id);
        } catch (err) {
            console.error(err);
        }
        if (notif.planId) router.push(`/plans/${notif.planId}`);
        else if (notif.type === "friend_accepted" || notif.type === "friend_request") router.push("/friends");
        else load();
=======
    const handleTap = (notif: Notification) => {
        markNotificationRead(notif.id);
        load();
        if (notif.planId) router.push(`/plans/${notif.planId}`);
        else if (notif.type === "friend_accepted" || notif.type === "friend_request") router.push("/friends");
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    };

    const typeEmoji = (type: Notification["type"]) => {
        switch (type) {
            case "plan_join": return "🐾";
            case "plan_confirmed": return "🎉";
            case "friend_accepted": return "🐶";
            case "friend_request": return "✉️";
            default: return "🔔";
        }
    };

<<<<<<< HEAD
    return (
        <div className="py-5 flex flex-col gap-4">
            <h1 className="text-xl font-bold text-gray-800">🔔 通知</h1>
            {!loaded ? (
                <SkeletonList count={4} />
            ) : notifications.length === 0 ? (
=======
    if (!currentUserId) return null;

    return (
        <div className="py-5 flex flex-col gap-4">
            <h1 className="text-xl font-bold text-gray-800">🔔 通知</h1>
            {notifications.length === 0 ? (
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
                <EmptyState emoji="🔕" title="通知はありません" />
            ) : (
                <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleTap(n)}
                            className={`w-full text-left rounded-2xl p-4 border shadow-sm transition-colors ${n.isRead
                                    ? "bg-white border-gray-100"
                                    : "bg-amber-50 border-amber-200"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl mt-0.5">{typeEmoji(n.type)}</span>
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${n.isRead ? "text-gray-600" : "text-gray-800"}`}>
                                        {n.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                                    <p className="text-xs text-gray-300 mt-1">
                                        {new Date(n.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                {!n.isRead && (
                                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
