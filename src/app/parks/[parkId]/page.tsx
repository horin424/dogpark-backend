"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MOCK_PARKS } from "@/data/mockData";
import {
    getPlansByDate,
    getUserById,
    preloadUsers,
    preloadProfiles,
    todayString,
} from "@/lib/storage";
import { Plan, Park, DogRunType, DogRunAreaSize, DogSize } from "@/types";
import { useTodayResync } from "@/lib/hooks";

function formatDateLabel(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function dogRunTypeLabel(t: DogRunType): string {
    if (t === "indoor") return "屋内";
    if (t === "outdoor") return "屋外";
    return "屋内・屋外";
}

function areaSizeLabel(s: DogRunAreaSize): string {
    if (s === "S") return "小規模 (S)";
    if (s === "M") return "中規模 (M)";
    return "大規模 (L)";
}

function dogAreaSummary(park: Park): string {
    const parts: string[] = [];
    if (park.smallDogArea) parts.push("小型犬");
    if (park.bigDogArea) parts.push("大型犬");
    if (park.freeDogArea) parts.push("フリー");
    return parts.length > 0 ? parts.join(" / ") : "—";
}

export default function ParkDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const parkId = params?.parkId as string;
    const park = MOCK_PARKS.find((p) => p.id === parkId);

    // Date defaults to the `?date=` query (set from Home) or today. Users can
    // change it from the picker below to look at any future day's plans.
    const initialDate = searchParams.get("date") || todayString();
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);
    const [plansForDate, setPlansForDate] = useState<Plan[]>([]);
    const [loaded, setLoaded] = useState(false);

    useTodayResync(selectedDate, setSelectedDate);

    useEffect(() => {
        let canceled = false;
        setLoaded(false);
        (async () => {
            try {
                await Promise.all([preloadUsers(), preloadProfiles()]);
                const all = await getPlansByDate(selectedDate);
                if (canceled) return;
                // Belt-and-braces: also assert plan.date matches selectedDate so
                // a stale record can't bleed yesterday's dogs into today's stats.
                setPlansForDate(
                    all.filter((p) => p.parkId === parkId && p.date === selectedDate),
                );
            } catch (err) {
                console.error("load park failed", err);
            } finally {
                if (!canceled) setLoaded(true);
            }
        })();
        return () => {
            canceled = true;
        };
    }, [parkId, selectedDate]);

    if (!park) {
        return (
            <div className="py-10 text-center text-gray-500">施設が見つかりません</div>
        );
    }

    const isToday = selectedDate === todayString();
    const dateLabel = isToday ? "今日" : formatDateLabel(selectedDate);
    const confirmed = plansForDate.filter((p) => p.status === "confirmed");
    const tentative = plansForDate.filter((p) => p.status === "tentative");
    const anonymousCount = 0;

    const dogStats = aggregateDogs(plansForDate);

    return (
        <div className="py-5 flex flex-col gap-6">
            {/* Hero */}
            <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm text-center">
                <div className="text-6xl mb-3">{park.imageEmoji}</div>
                <h1 className="text-xl font-bold text-gray-800">{park.name}</h1>
                <p className="text-sm text-gray-400 mt-1">{park.address}</p>
            </div>

            {/* 基本情報 */}
            <section className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                <h2 className="font-bold text-gray-700 text-sm mb-3">📋 基本情報</h2>
                <dl className="flex flex-col gap-2 text-sm">
                    {park.area && <InfoRow label="エリア" value={park.area} />}
                    {park.type && <InfoRow label="形態" value={dogRunTypeLabel(park.type)} />}
                    {park.areaSize && <InfoRow label="広さ" value={areaSizeLabel(park.areaSize)} />}
                    <InfoRow label="ドッグエリア" value={dogAreaSummary(park)} />
                    {park.official !== undefined && (
                        <InfoRow label="公式" value={park.official ? "公式施設" : "—"} />
                    )}
                    {park.openTime && park.closeTime && (
                        <InfoRow label="営業時間" value={`${park.openTime} 〜 ${park.closeTime}`} />
                    )}
                    {park.fee && <InfoRow label="料金" value={park.fee} />}
                    {park.hasParkingLot !== undefined && (
                        <InfoRow label="駐車場" value={park.hasParkingLot ? "あり" : "なし"} />
                    )}
                    {park.requiresCertificate !== undefined && (
                        <InfoRow label="証明書" value={park.requiresCertificate ? "要・接種証明" : "不要"} />
                    )}
                    {park.notes && <InfoRow label="注意点" value={park.notes} />}
                </dl>
            </section>

            {/* 予定 */}
            <section>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <h2 className="font-bold text-gray-700 text-sm">📅 {dateLabel}の予定</h2>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                        <span>📅 日付</span>
                        <input
                            type="date"
                            value={selectedDate}
                            min={todayString()}
                            onChange={(e) => setSelectedDate(e.target.value || todayString())}
                            className="border border-amber-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        {!isToday && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate(todayString())}
                                className="text-amber-600 underline"
                            >
                                今日に戻す
                            </button>
                        )}
                    </label>
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                    {confirmed.length > 0 && (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                            確定 {confirmed.length}
                        </span>
                    )}
                    {tentative.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">
                            迷い中 {tentative.length}
                        </span>
                    )}
                    {anonymousCount > 0 && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                            匿名 {anonymousCount}
                        </span>
                    )}
                    {loaded && confirmed.length === 0 && tentative.length === 0 && anonymousCount === 0 && (
                        <span className="text-gray-400 text-sm">{dateLabel}の予定はまだありません</span>
                    )}
                </div>

                {/* Dogs breakdown */}
                {dogStats.total > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm mb-3">
                        <h3 className="font-bold text-gray-700 text-sm mb-3">
                            📊 {isToday ? "今日" : dateLabel + "に"}集まるワンちゃん ({dogStats.total}匹)
                        </h3>
                        <div className="flex gap-2 mb-3">
                            <SizePill label="小型" count={dogStats.size.small} />
                            <SizePill label="中型" count={dogStats.size.medium} />
                            <SizePill label="大型" count={dogStats.size.large} />
                        </div>
                        {dogStats.breeds.length > 0 && (
                            <div className="mb-3">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                    犬種
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {dogStats.breeds.map((b) => (
                                        <span
                                            key={b.label}
                                            className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full border border-amber-100"
                                        >
                                            {b.emoji} {b.label}{" "}
                                            <span className="text-amber-500 font-semibold">×{b.count}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {dogStats.tags.length > 0 && (
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                    性格
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {dogStats.tags.map((t) => (
                                        <span
                                            key={t.label}
                                            className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full border border-rose-100"
                                        >
                                            {t.label}{" "}
                                            <span className="text-rose-400 font-semibold">×{t.count}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Plan list */}
                <div className="flex flex-col gap-2">
                    {plansForDate.map((plan) => {
                        const creator = getUserById(plan.creatorId);
                        return (
                            <Link key={plan.id} href={`/plans/${plan.id}`}>
                                <div className={`bg-white rounded-xl p-3 border shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow ${plan.status === "tentative" ? "border-yellow-200 bg-yellow-50" : "border-amber-100"}`}>
                                    <span className="text-2xl">{creator?.dogs[0]?.avatarEmoji ?? "🐕"}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-800">
                                            {creator?.dogs[0]?.name} ({creator?.displayName})
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {plan.timeSlot === "morning" ? "🌅 午前" : plan.timeSlot === "afternoon" ? "☀️ 午後" : "🌆 夕方"}
                                            {" · "}
                                            <span className={plan.status === "confirmed" ? "text-green-600" : "text-yellow-600"}>
                                                {plan.status === "confirmed" ? "確定" : "迷い中"}
                                            </span>
                                        </p>
                                    </div>
                                    <span className="text-gray-300">›</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* CTA */}
            <Link
                href={`/plans/new?parkId=${park.id}`}
                className="block bg-amber-500 text-white text-center py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-amber-600 transition-colors"
            >
                📝 この場所に予定を入れる
            </Link>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2 text-sm">
            <dt className="text-gray-400 flex-shrink-0 w-20">{label}</dt>
            <dd className="text-gray-700">{value}</dd>
        </div>
    );
}

function SizePill({ label, count }: { label: string; count: number }) {
    const isZero = count === 0;
    return (
        <span
            className={`flex-1 text-center text-xs py-1.5 rounded-lg font-medium ${isZero
                ? "bg-gray-50 text-gray-300"
                : "bg-amber-100 text-amber-800"
                }`}
        >
            {label} {count}
        </span>
    );
}

interface DogStats {
    total: number;
    size: Record<DogSize, number>;
    breeds: { label: string; emoji: string; count: number }[];
    tags: { label: string; count: number }[];
}

// Walks the selected date's plans, dedupes participants (a user could
// appear in multiple time slots — we count their dogs once), and tallies
// size + breed + tags across every dog on each participant's profile.
function aggregateDogs(plans: Plan[]): DogStats {
    const seen = new Set<string>();
    const sizeCounts: Record<DogSize, number> = { small: 0, medium: 0, large: 0 };
    const breedCounts = new Map<string, number>();
    const breedEmoji = new Map<string, string>();
    const tagCounts = new Map<string, number>();
    let total = 0;

    for (const plan of plans) {
        for (const uid of plan.participantIds) {
            if (seen.has(uid)) continue;
            seen.add(uid);
            const u = getUserById(uid);
            if (!u || u.dogs.length === 0) continue;
            for (const dog of u.dogs) {
                total += 1;
                sizeCounts[dog.size] = (sizeCounts[dog.size] ?? 0) + 1;
                const breedLabel = dog.breed?.trim() || "未設定";
                breedCounts.set(breedLabel, (breedCounts.get(breedLabel) ?? 0) + 1);
                if (!breedEmoji.has(breedLabel)) {
                    breedEmoji.set(breedLabel, dog.avatarEmoji || "🐕");
                }
                for (const tag of dog.tags) {
                    const t = tag.trim();
                    if (!t) continue;
                    tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
                }
            }
        }
    }

    const breeds = Array.from(breedCounts.entries())
        .map(([label, count]) => ({
            label,
            emoji: breedEmoji.get(label) ?? "🐕",
            count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));

    const tags = Array.from(tagCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));

    return { total, size: sizeCounts, breeds, tags };
}
