"use client";
import { useEffect, useState } from "react";
import {
    getEvents,
    getUserById,
    preloadUsers,
} from "@/lib/storage";
import { MOCK_PARKS } from "@/data/mockData";
import { AppEvent, EventType } from "@/types";

const TYPE_LABEL: Record<EventType, string> = {
    plan_created: "予定作成",
    plan_join: "参加",
    status_change: "ステータス変更",
    participants_changed: "参加者数変動",
};

const TYPE_COLOR: Record<EventType, string> = {
    plan_created: "bg-blue-100 text-blue-700",
    plan_join: "bg-amber-100 text-amber-700",
    status_change: "bg-green-100 text-green-700",
    participants_changed: "bg-purple-100 text-purple-700",
};

const STATUS_LABEL: Record<string, string> = {
    tentative: "迷い中",
    confirmed: "確定",
};

export default function AdminEventsPage() {
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState<EventType | "all">("all");

    useEffect(() => {
        let canceled = false;
        (async () => {
            try {
                await preloadUsers();
                const list = await getEvents(500);
                if (!canceled) setEvents(list);
            } catch (err) {
                console.error("load events failed", err);
            } finally {
                if (!canceled) setLoaded(true);
            }
        })();
        return () => {
            canceled = true;
        };
    }, []);

    const filtered =
        filter === "all" ? events : events.filter((e) => e.type === filter);

    const counts = events.reduce<Record<string, number>>((acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="py-5 flex flex-col gap-5">
            <div>
                <h1 className="text-xl font-bold text-gray-800">📊 イベントログ</h1>
                <p className="text-xs text-gray-400 mt-1">
                    MVP検証用の最小ログ（最新500件）
                </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TYPE_LABEL) as EventType[]).map((t) => (
                    <div
                        key={t}
                        className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm"
                    >
                        <p className="text-xs text-gray-500">{TYPE_LABEL[t]}</p>
                        <p className="text-xl font-bold text-gray-800">
                            {counts[t] ?? 0}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                <FilterChip
                    label={`すべて (${events.length})`}
                    active={filter === "all"}
                    onClick={() => setFilter("all")}
                />
                {(Object.keys(TYPE_LABEL) as EventType[]).map((t) => (
                    <FilterChip
                        key={t}
                        label={`${TYPE_LABEL[t]} (${counts[t] ?? 0})`}
                        active={filter === t}
                        onClick={() => setFilter(t)}
                    />
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                {!loaded ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        読み込み中…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        イベントがありません
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-amber-50 text-gray-500">
                                <tr>
                                    <th className="text-left px-3 py-2 font-semibold">時刻</th>
                                    <th className="text-left px-3 py-2 font-semibold">種別</th>
                                    <th className="text-left px-3 py-2 font-semibold">ユーザー</th>
                                    <th className="text-left px-3 py-2 font-semibold">ドッグラン</th>
                                    <th className="text-left px-3 py-2 font-semibold">変化</th>
                                    <th className="text-right px-3 py-2 font-semibold">参加者</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((e) => {
                                    const user = getUserById(e.userId);
                                    const park = e.parkId
                                        ? MOCK_PARKS.find((p) => p.id === e.parkId)
                                        : undefined;
                                    return (
                                        <tr
                                            key={e.id}
                                            className="border-t border-amber-50 hover:bg-amber-50/40"
                                        >
                                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                                {formatTime(e.createdAt)}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[e.type]}`}
                                                >
                                                    {TYPE_LABEL[e.type]}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {user?.displayName ?? e.userId.slice(0, 6)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {park?.name ?? (e.parkId ? "—" : "")}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">
                                                {e.fromStatus && e.toStatus
                                                    ? `${STATUS_LABEL[e.fromStatus]} → ${STATUS_LABEL[e.toStatus]}`
                                                    : e.toStatus
                                                      ? STATUS_LABEL[e.toStatus]
                                                      : ""}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-gray-700">
                                                {e.participantCount ?? ""}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}
        >
            {label}
        </button>
    );
}

function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        const m = (n: number) => n.toString().padStart(2, "0");
        return `${m(d.getMonth() + 1)}/${m(d.getDate())} ${m(d.getHours())}:${m(d.getMinutes())}`;
    } catch {
        return iso;
    }
}
