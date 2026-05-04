"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_PARKS } from "@/data/mockData";
import {
  getCurrentUserId,
  getFriendIds,
  getTodayPlans,
  getUserById,
  updatePlan,
  addNotification,
  generateId,
  timeSlotLabel,
  timeSlotEmoji,
  statusLabel,
  seedDemoData,
  addMessage,
} from "@/lib/storage";
import { Plan, Park } from "@/types";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import DogAvatar from "@/components/DogAvatar";

export default function HomePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendPlans, setFriendPlans] = useState<Plan[]>([]);
  const [parks] = useState<Park[]>(MOCK_PARKS);
  const { showToast, ToastElement } = useToast();

  const loadData = useCallback(() => {
    seedDemoData();
    const uid = getCurrentUserId();
    setCurrentUserId(uid);
    if (uid) {
      const friendIds = getFriendIds(uid);
      const todayPlans = getTodayPlans();
      const fp = todayPlans.filter(
        (p) => friendIds.includes(p.creatorId) && p.creatorId !== uid
      );
      setFriendPlans(fp);
    } else {
      setFriendPlans([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoin = (plan: Plan, buttonLabel: string) => {
    if (!currentUserId) return;
    if (plan.participantIds.includes(currentUserId)) {
      showToast("すでに参加しています");
      return;
    }
    const updated: Plan = {
      ...plan,
      participantIds: [...plan.participantIds, currentUserId],
    };
    updatePlan(updated);

    // System message
    const me = getUserById(currentUserId);
    addMessage({
      id: generateId(),
      planId: plan.id,
      senderId: "system",
      text: `${me?.displayName ?? "あなた"} が参加しました！`,
      createdAt: new Date().toISOString(),
      isSystem: true,
    });

    // Notification to creator
    addNotification({
      id: generateId(),
      userId: plan.creatorId,
      type: "plan_join",
      title: "参加者が増えました！",
      body: `${me?.displayName ?? "フレンド"} が ${timeSlotLabel(plan.timeSlot)} の予定に参加しました`,
      planId: plan.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    showToast("✅ 参加しました！");
    // Navigate to plan detail so user goes directly to chat
    router.push(`/plans/${plan.id}?scrollToChat=1`);
  };

  const todayPlansByPark = (parkId: string) => {
    const all = getTodayPlans();
    return {
      confirmed: all.filter((p) => p.parkId === parkId && p.status === "confirmed").length,
      tentative: all.filter((p) => p.parkId === parkId && p.status === "tentative").length,
      anonymous: Math.floor(Math.random() * 3), // 匿名は仮データ
    };
  };

  return (
    <div className="py-5 flex flex-col gap-8">
      {ToastElement}

      {/* 今日のフレンド予定 */}
      <section>
        <h2 className="text-base font-bold text-gray-700 mb-3">
          📅 今日のフレンド予定
        </h2>
        {!currentUserId ? (
          <div className="bg-white rounded-2xl p-5 border border-amber-100 text-center">
            <p className="text-gray-500 text-sm mb-3">
              ログインするとフレンドの予定が見られます
            </p>
            <Link
              href="/login"
              className="inline-block bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              ログイン
            </Link>
          </div>
        ) : friendPlans.length === 0 ? (
          <EmptyState
            emoji="🌤️"
            title="今日はまだ予定がないみたい"
            description="予定を入れると誘いやすくなるよ"
            action={
              <Link
                href="/plans/new"
                className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-600 transition-colors inline-block"
              >
                予定を入れる
              </Link>
            }
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {friendPlans.map((plan) => (
              <FriendPlanCard
                key={plan.id}
                plan={plan}
                currentUserId={currentUserId}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}
      </section>

      {/* 近くのドッグラン */}
      <section>
        <h2 className="text-base font-bold text-gray-700 mb-3">
          🗺️ 近くのドッグラン
        </h2>
        {parks.length === 0 ? (
          <EmptyState emoji="🏞️" title="施設情報がありません" />
        ) : (
          <div className="flex flex-col gap-3">
            {parks.map((park) => {
              const counts = todayPlansByPark(park.id);
              return (
                <ParkCard key={park.id} park={park} counts={counts} />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────
function FriendPlanCard({
  plan,
  currentUserId,
  onJoin,
}: {
  plan: Plan;
  currentUserId: string;
  onJoin: (plan: Plan, label: string) => void;
}) {
  const creator = getUserById(plan.creatorId);
  const park = MOCK_PARKS.find((p) => p.id === plan.parkId);
  const isTentative = plan.status === "tentative";
  const isParticipating = plan.participantIds.includes(currentUserId);

  return (
    <div
      className={`flex-shrink-0 w-56 rounded-2xl p-4 border shadow-sm flex flex-col gap-2 ${isTentative
        ? "bg-yellow-50 border-yellow-200"
        : "bg-white border-amber-100"
        }`}
    >
      {/* Dog avatar + name */}
      <div className="flex items-center gap-2">
        <DogAvatar friendCode={creator?.friendCode} size="md" />
        <div>

          <p className="font-semibold text-gray-800 text-sm">
            {creator?.dogs[0]?.name ?? "???"}
          </p>
          <p className="text-xs text-gray-400">{creator?.displayName}</p>
        </div>
      </div>
      {/* Park & time */}
      <div className="text-xs text-gray-600">
        <p className="font-medium truncate">{park?.name ?? "施設不明"}</p>
        <p className="text-gray-400">
          {timeSlotEmoji(plan.timeSlot)} {timeSlotLabel(plan.timeSlot)}
        </p>
      </div>
      {/* Status badge */}
      <span
        className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${isTentative
          ? "bg-yellow-200 text-yellow-800"
          : "bg-green-100 text-green-700"
          }`}
      >
        {statusLabel(plan.status)}
      </span>
      {/* Tentative nudge */}
      {isTentative && (
        <p className="text-xs text-yellow-700">あと1人で決まりそうかも？</p>
      )}
      {!isParticipating ? (
        <button
          onClick={() =>
            onJoin(plan, isTentative ? "一緒に行くよ" : "同じ時間に行く")
          }
          className={`mt-auto text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${isTentative
            ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
            : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
        >
          {isTentative ? "一緒に行くよ" : "同じ時間に行く"}
        </button>
      ) : (
        <Link
          href={`/plans/${plan.id}`}
          className="mt-auto text-xs text-amber-700 font-semibold underline"
        >
          参加済み → 詳細
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
function ParkCard({
  park,
  counts,
}: {
  park: Park;
  counts: { confirmed: number; tentative: number; anonymous: number };
}) {
  return (
    <Link href={`/parks/${park.id}`}>
      <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="w-16 h-16 flex items-center justify-center bg-amber-50 rounded-xl text-4xl flex-shrink-0">
          {park.imageEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {park.name}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{park.address}</p>
          <div className="flex gap-2 mt-1.5 text-xs">
            {counts.confirmed > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                確定 {counts.confirmed}
              </span>
            )}
            {counts.tentative > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                迷い中 {counts.tentative}
              </span>
            )}
            {counts.anonymous > 0 && (
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                匿名 {counts.anonymous}
              </span>
            )}
            {counts.confirmed === 0 && counts.tentative === 0 && counts.anonymous === 0 && (
              <span className="text-gray-300">今日の予定なし</span>
            )}
          </div>
        </div>
        <span className="text-gray-300 text-lg">›</span>
      </div>
    </Link>
  );
}
