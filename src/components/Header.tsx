"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUserId, getUnreadCount } from "@/lib/storage";

export default function Header() {
    const [userId, setUserId] = useState<string | null>(null);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        const id = getCurrentUserId();
        setUserId(id);
        if (id) setUnread(getUnreadCount(id));
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-amber-100 shadow-sm">
            <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl">🐾</span>
                    <span className="font-bold text-amber-700 text-lg leading-tight">
                        ここにいるワン
                    </span>
                </Link>
                <nav className="flex items-center gap-1">
                    <NavIcon
                        href={userId ? "/notifications" : "/login?next=/notifications"}
                        label="通知"
                        badge={unread > 0 ? unread : undefined}
                    >
                        🔔
                    </NavIcon>
                    <NavIcon
                        href={userId ? "/friends" : "/login?next=/friends"}
                        label="フレンド"
                    >
                        👥
                    </NavIcon>
                    <NavIcon
                        href={userId ? "/me" : "/login?next=/me"}
                        label="マイページ"
                    >
                        👤
                    </NavIcon>
                </nav>
            </div>
        </header>
    );
}

function NavIcon({
    href,
    label,
    children,
    badge,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-amber-50 transition-colors"
            aria-label={label}
        >
            <span className="text-xl">{children}</span>
            {badge !== undefined && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">
                    {badge > 9 ? "9+" : badge}
                </span>
            )}
        </Link>
    );
}
