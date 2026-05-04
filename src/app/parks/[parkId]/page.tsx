"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_PARKS } from "@/data/mockData";
import { getTodayPlans, getUserById } from "@/lib/storage";
import { Plan } from "@/types";

export default function ParkDetailPage() {
    const params = useParams();
    const parkId = params?.parkId as string;
    const park = MOCK_PARKS.find((p) => p.id === parkId);
    const [todayPlans, setTodayPlans] = useState<Plan[]>([]);

    useEffect(() => {
        setTodayPlans(getTodayPlans().filter((p) => p.parkId === parkId));
    }, [parkId]);

    if (!park) {
        return (
            <div className="py-10 text-center text-gray-500">施設が見つかりません</div>
        );
    }

    const confirmed = todayPlans.filter((p) => p.status === "confirmed");
    const tentative = todayPlans.filter((p) => p.status === "tentative");
    const anonymousCount = Math.floor(Math.random() * 4);

    return (
        <div className="py-5 flex flex-col gap-6">
            {/* Hero */}
            <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm text-center">
                <div className="text-6xl mb-3">{park.imageEmoji}</div>
                <h1 className="text-xl font-bold text-gray-800">{park.name}</h1>
                <p className="text-sm text-gray-400 mt-1">{park.address}</p>
                <p className="text-sm text-amber-600 mt-1">📍 {park.distanceKm}km</p>
            </div>

            {/* 基本情報 */}
            <section className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                <h2 className="font-bold text-gray-700 text-sm mb-3">📋 基本情報</h2>
                <dl className="flex flex-col gap-2 text-sm">
                    <InfoRow label="営業時間" value={`${park.openTime} 〜 ${park.closeTime}`} />
                    <InfoRow label="料金" value={park.fee} />
                    <InfoRow label="駐車場" value={park.hasParkingLot ? "あり" : "なし"} />
                    <InfoRow label="証明書" value={park.requiresCertificate ? "要・接種証明" : "不要"} />
                    <InfoRow label="注意点" value={park.notes} />
                </dl>
            </section>

            {/* 今日の予定 */}
            <section>
                <h2 className="font-bold text-gray-700 text-sm mb-3">📅 今日の予定</h2>
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
                    {confirmed.length === 0 && tentative.length === 0 && anonymousCount === 0 && (
                        <span className="text-gray-400 text-sm">今日の予定はまだありません</span>
                    )}
                </div>
                {/* Plan list */}
                <div className="flex flex-col gap-2">
                    {todayPlans.map((plan) => {
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
