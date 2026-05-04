"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MOCK_PARKS } from "@/data/mockData";
import {
    getCurrentUserId,
    addPlan,
    generateId,
    todayString,
} from "@/lib/storage";
import { TimeSlot, PlanStatus } from "@/types";

function NewPlanInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parkId = searchParams.get("parkId") ?? "";

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [date, setDate] = useState(todayString());
    const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
    const [status, setStatus] = useState<PlanStatus>("tentative");
    const [note, setNote] = useState("");

    useEffect(() => {
        const uid = getCurrentUserId();
        if (!uid) {
            router.replace(`/login?next=/plans/new${parkId ? `?parkId=${parkId}` : ""}`);
            return;
        }
        setCurrentUserId(uid);
        setDate(todayString());
    }, [router, parkId]);

    const park = MOCK_PARKS.find((p) => p.id === parkId);

    const maxDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split("T")[0];
    })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId || !parkId) return;
        const plan = {
            id: generateId(),
            parkId,
            creatorId: currentUserId,
            date,
            timeSlot,
            status,
            note,
            participantIds: [currentUserId],
            createdAt: new Date().toISOString(),
        };
        addPlan(plan);
        router.push(parkId ? `/parks/${parkId}` : "/");
    };

    if (!currentUserId) return null;

    return (
        <div className="py-5">
            <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-800">📝 予定を入れる</h1>
                {park && (
                    <p className="text-sm text-amber-600 mt-1">
                        📍 {park.name}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!parkId && (
                    <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">施設を選ぶ</label>
                        <p className="text-sm text-gray-400">施設ページから予定を作ってください</p>
                    </div>
                )}

                {/* Date */}
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📅 日付（2週間以内）</label>
                    <input
                        type="date"
                        value={date}
                        min={todayString()}
                        max={maxDate}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
                        required
                    />
                </div>

                {/* Time slot */}
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">🕐 時間帯</label>
                    <div className="flex gap-2">
                        {(["morning", "afternoon", "evening"] as TimeSlot[]).map((ts) => (
                            <button
                                key={ts}
                                type="button"
                                onClick={() => setTimeSlot(ts)}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${timeSlot === ts
                                        ? "bg-amber-500 text-white"
                                        : "bg-amber-50 text-gray-600 border border-amber-100"
                                    }`}
                            >
                                {ts === "morning" ? "🌅 午前" : ts === "afternoon" ? "☀️ 午後" : "🌆 夕方"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">✨ 状態</label>
                    <div className="flex gap-2">
                        {([
                            { value: "tentative", label: "迷い中", desc: "仲間を募集" },
                            { value: "confirmed", label: "確定", desc: "行くのが決まった" },
                        ] as { value: PlanStatus; label: string; desc: string }[]).map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => setStatus(s.value)}
                                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors border ${status === s.value
                                        ? s.value === "tentative"
                                            ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                                            : "bg-green-100 border-green-300 text-green-800"
                                        : "bg-gray-50 border-gray-200 text-gray-500"
                                    }`}
                            >
                                <div>{s.label}</div>
                                <div className="text-xs opacity-70">{s.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">💬 一言（任意）</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="「午前中ならいつでも！」など..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 h-20 resize-none"
                        maxLength={100}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!parkId}
                    className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-amber-600 transition-colors disabled:opacity-40"
                >
                    予定を入れる
                </button>
            </form>
        </div>
    );
}

export default function NewPlanPage() {
    return (
        <Suspense fallback={<div className="py-10 text-center text-gray-400">読み込み中...</div>}>
            <NewPlanInner />
        </Suspense>
    );
}
