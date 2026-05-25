"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getCurrentUserId,
    getCurrentUser,
    logout,
    getActivePlans,
<<<<<<< HEAD
    fetchProfileByFriendCode,
    timeSlotLabel,
    timeSlotEmoji,
    statusLabel,
    DogProfile,
    getCachedActivePlans,
    setCachedActivePlans,
=======
    todayString,
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
} from "@/lib/storage";
import { User, Plan } from "@/types";
import { MOCK_PARKS } from "@/data/mockData";
import EmptyState from "@/components/EmptyState";
<<<<<<< HEAD
import DogAvatar from "@/components/DogAvatar";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
=======
import { timeSlotLabel, timeSlotEmoji, statusLabel, getProfileByFriendCode } from "@/lib/storage";
import DogAvatar from "@/components/DogAvatar";
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde


export default function MePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
<<<<<<< HEAD
    const [profile, setProfile] = useState<DogProfile | null>(null);
    const [myPlans, setMyPlans] = useState<Plan[]>([]);
    const [joinedPlans, setJoinedPlans] = useState<Plan[]>([]);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(async () => {
=======
    const [myPlans, setMyPlans] = useState<Plan[]>([]);
    const [joinedPlans, setJoinedPlans] = useState<Plan[]>([]);

    const load = useCallback(() => {
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
        const uid = getCurrentUserId();
        if (!uid) {
            router.replace("/login?next=/me");
            return;
        }
<<<<<<< HEAD

        const cachedPlans = getCachedActivePlans();
        if (cachedPlans) {
            setMyPlans(cachedPlans.filter((p) => p.creatorId === uid));
            setJoinedPlans(
                cachedPlans.filter(
                    (p) => p.participantIds.includes(uid) && p.creatorId !== uid,
                ),
            );
        }

        try {
            const [u, active] = await Promise.all([
                getCurrentUser(),
                getActivePlans(),
            ]);
            setUser(u);
            setCachedActivePlans(active);
            setMyPlans(active.filter((p) => p.creatorId === uid));
            setJoinedPlans(
                active.filter(
                    (p) => p.participantIds.includes(uid) && p.creatorId !== uid,
                ),
            );
            if (u) {
                const p = await fetchProfileByFriendCode(u.friendCode);
                setProfile(p ?? null);
            }
        } catch (err) {
            console.error("load me failed", err);
        } finally {
            setLoaded(true);
        }
=======
        const u = getCurrentUser();
        setUser(u);
        const active = getActivePlans();
        setMyPlans(active.filter((p) => p.creatorId === uid));
        setJoinedPlans(
            active.filter((p) => p.participantIds.includes(uid) && p.creatorId !== uid)
        );
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    }, [router]);

    useEffect(() => {
        load();
    }, [load]);

    const handleLogout = () => {
        logout();
        router.replace("/");
    };

<<<<<<< HEAD
    if (!user) {
        if (!loaded) {
            return (
                <div className="py-5 flex flex-col gap-6">
                    <div className="h-6 w-32 bg-amber-100/70 rounded animate-pulse" />
                    <SkeletonCard />
                    <div className="h-5 w-24 bg-amber-100/70 rounded animate-pulse" />
                    <SkeletonList count={2} />
                </div>
            );
        }
        return null;
    }
=======
    if (!user) return null;
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde

    return (
        <div className="py-5 flex flex-col gap-6">
            {/* Dog cards */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold text-gray-800">🐾 マイページ</h1>
                    <Link
                        href="/me/edit"
                        className="text-sm text-amber-600 font-semibold"
                    >
                        編集
                    </Link>
                </div>
                <div className="flex flex-col gap-3">
<<<<<<< HEAD
                    {user.dogs.map((dog, idx) => (
=======
                    {user.dogs.map((dog) => (
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
                        <Link key={dog.id} href="/me/edit">
                            <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                <DogAvatar friendCode={user.friendCode} size="xl" />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">
<<<<<<< HEAD
                                        {(idx === 0 && profile?.dogName) || dog.name}
=======
                                        {getProfileByFriendCode(user.friendCode)?.dogName || dog.name}
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {dog.breed ?? "犬種未設定"} ·{" "}
                                        {dog.size === "small" ? "小型" : dog.size === "medium" ? "中型" : "大型"}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
<<<<<<< HEAD
                                        {((idx === 0 && profile?.tags) || dog.tags).map((tag) => (
=======
                                        {(getProfileByFriendCode(user.friendCode)?.tags || dog.tags).map((tag) => (
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
                                            <span
                                                key={tag}
                                                className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-100"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <span className="text-gray-300 text-lg">›</span>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/me/edit"
                    className="mt-3 flex items-center justify-center gap-2 w-full border-2 border-dashed border-amber-200 text-amber-500 py-3 rounded-2xl text-sm font-semibold hover:border-amber-400 transition-colors"
                >
                    ＋ ワンちゃんを追加
                </Link>
            </section>

            {/* My plans */}
            <section>
<<<<<<< HEAD
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-700 text-base">📅 自分の予定</h2>
                    <Link
                        href="/plans/new"
                        className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-amber-600 transition-colors"
                    >
                        ＋ 予定を追加
                    </Link>
                </div>
=======
                <h2 className="font-bold text-gray-700 text-base mb-3">📅 自分の予定</h2>
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
                {myPlans.length === 0 ? (
                    <EmptyState
                        emoji="📭"
                        title="予定がありません"
                        action={
                            <Link href="/plans/new" className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold inline-block">
                                予定を入れる
                            </Link>
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-2">
                        {myPlans.map((plan) => (
                            <PlanRow key={plan.id} plan={plan} />
                        ))}
                    </div>
                )}
            </section>

            {/* Joined plans */}
            {joinedPlans.length > 0 && (
                <section>
                    <h2 className="font-bold text-gray-700 text-base mb-3">🐾 参加中の予定</h2>
                    <div className="flex flex-col gap-2">
                        {joinedPlans.map((plan) => (
                            <PlanRow key={plan.id} plan={plan} />
                        ))}
                    </div>
                </section>
            )}

            {/* Friend code + Logout */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs text-amber-600 font-medium mb-1">友達コード</p>
                <p className="font-bold text-amber-800 text-lg tracking-wider">{user.friendCode}</p>
            </div>
            <button
                onClick={handleLogout}
                className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
                ログアウト
            </button>
        </div>
    );
}

function PlanRow({ plan }: { plan: Plan }) {
    const park = MOCK_PARKS.find((p) => p.id === plan.parkId);
    return (
        <Link href={`/plans/${plan.id}`}>
            <div className={`rounded-xl p-3 border shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow ${plan.status === "tentative" ? "bg-yellow-50 border-yellow-200" : "bg-white border-amber-100"}`}>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{park?.name ?? "施設不明"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {timeSlotEmoji(plan.timeSlot)} {timeSlotLabel(plan.timeSlot)} · {plan.date}
                    </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-200 text-yellow-800"}`}>
                    {statusLabel(plan.status)}
                </span>
                <span className="text-gray-300">›</span>
            </div>
        </Link>
    );
}
