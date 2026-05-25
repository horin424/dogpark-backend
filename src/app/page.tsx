"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_PARKS } from "@/data/mockData";
import {
  getCurrentUserId,
  getFriendIds,
  getPlansByDate,
  getUserById,
  updatePlan,
  addNotification,
  generateId,
  timeSlotLabel,
  timeSlotEmoji,
  statusLabel,
  seedDemoData,
  addMessage,
  preloadUsers,
  preloadProfiles,
  logEvent,
  todayString,
} from "@/lib/storage";
import { Plan, Park } from "@/types";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import DogAvatar from "@/components/DogAvatar";
import { useTodayResync } from "@/lib/hooks";

export default function HomePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendPlans, setFriendPlans] = useState<Plan[]>([]);
  const [plansForDate, setPlansForDate] = useState<Plan[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [parks] = useState<Park[]>(MOCK_PARKS);
  const [loaded, setLoaded] = useState(false);
  const { showToast, ToastElement } = useToast();

  const loadInitial = useCallback(async () => {
    try {
      await seedDemoData();
      await Promise.all([preloadUsers(), preloadProfiles()]);
      const uid = getCurrentUserId();
      setCurrentUserId(uid);
      const today = todayString();
      const todayPlans = await getPlansByDate(today);
      if (uid) {
        const friendIds = await getFriendIds(uid);
        const fp = todayPlans.filter(
          (p) => friendIds.includes(p.creatorId) && p.creatorId !== uid,
        );
        setFriendPlans(fp);
      } else {
        setFriendPlans([]);
      }
    } catch (err) {
      console.error("load home failed", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  const loadPlansForDate = useCallback(async (date: string) => {
    try {
      const dayPlans = await getPlansByDate(date);
      setPlansForDate(dayPlans);
    } catch (err) {
      console.error("load plans for date failed", err);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadPlansForDate(selectedDate);
  }, [loadPlansForDate, selectedDate]);

  useTodayResync(selectedDate, setSelectedDate);

  const handleJoin = async (plan: Plan) => {
    if (!currentUserId) return;
    if (plan.participantIds.includes(currentUserId)) {
      showToast("すでに参加しています");
      return;
    }
    const updated: Plan = {
      ...plan,
      participantIds: [...plan.participantIds, currentUserId],
    };
    try {
      await updatePlan(updated);
      await logEvent({
        type: "plan_join",
        userId: currentUserId,
        planId: plan.id,
        parkId: plan.parkId,
        toStatus: plan.status,
        participantCount: updated.participantIds.length,
      });
      await logEvent({
        type: "participants_changed",
        userId: currentUserId,
        planId: plan.id,
        parkId: plan.parkId,
        participantCount: updated.participantIds.length,
      });
      const me = getUserById(currentUserId);
      await addMessage({
        id: generateId(),
        planId: plan.id,
        senderId: "system",
        text: `${me?.displayName ?? "あなた"} が参加しました！`,
        createdAt: new Date().toISOString(),
        isSystem: true,
      });
      await addNotification({
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
      router.push(`/plans/${plan.id}?scrollToChat=1`);
    } catch (err) {
      console.error(err);
      showToast("参加に失敗しました");
    }
  };

  const participantCountsByPark = (parkId: string) => {
    const planSum = (status: Plan["status"]) =>
      plansForDate
        .filter((p) => p.parkId === parkId && p.status === status)
        .reduce((acc, p) => acc + (p.participantIds?.length ?? 0), 0);
    return {
      confirmed: planSum("confirmed"),
      tentative: planSum("tentative"),
      anonymous: 0,
    };
  };

  const rankedParks = [...parks]
    .map((park) => ({ park, counts: participantCountsByPark(park.id) }))
    .sort((a, b) => {
      const totalA = a.counts.confirmed + a.counts.tentative;
      const totalB = b.counts.confirmed + b.counts.tentative;
      if (totalB !== totalA) return totalB - totalA;
      return a.park.name.localeCompare(b.park.name, "ja");
    });

  const isToday = selectedDate === todayString();
  const formatDateLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="py-5 flex flex-col gap-8">
      {ToastElement}

      {/* 今日のフレンド予定 */}
      <section>
        <h2 className="text-base font-bold text-gray-700 mb-3">
          📅 今日のフレンド予定
        </h2>
        {!loaded ? (
          <div className="bg-white rounded-2xl p-5 border border-amber-100 text-center text-gray-400 text-sm">
            読み込み中…
          </div>
        ) : !currentUserId ? (
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

      {/* ドッグラン一覧 */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h2 className="text-base font-bold text-gray-700">
            🏞️ ドッグラン一覧
            <span className="ml-2 text-xs font-normal text-gray-400">
              参加人数順
            </span>
          </h2>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span>📅 日付</span>
            <input
              type="date"
              value={selectedDate}
              min={todayString()}
              onChange={(e) =>
                setSelectedDate(e.target.value || todayString())
              }
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
        <p className="text-xs text-gray-400 mb-3">
          {isToday ? "今日" : formatDateLabel(selectedDate)}
          の「確定 + 迷い中」参加者の合計が多い順に表示しています。
        </p>
        {parks.length === 0 ? (
          <EmptyState emoji="🏞️" title="施設情報がありません" />
        ) : (
          <div className="flex flex-col gap-3">
            {rankedParks.map(({ park, counts }) => (
              <ParkCard
                key={park.id}
                park={park}
                counts={counts}
                selectedDate={selectedDate}
              />
            ))}
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
  onJoin: (plan: Plan) => void;
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
          onClick={() => onJoin(plan)}
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
  selectedDate,
}: {
  park: Park;
  counts: { confirmed: number; tentative: number; anonymous: number };
  selectedDate: string;
}) {
  // Only include the query param when the user picked a non-default date —
  // keeps URLs clean for the common "today" case.
  const href =
    selectedDate === todayString()
      ? `/parks/${park.id}`
      : `/parks/${park.id}?date=${selectedDate}`;
  return (
    <Link href={href}>
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
              <span className="text-gray-300">予定なし</span>
            )}
          </div>
        </div>
        <span className="text-gray-300 text-lg">›</span>
      </div>
    </Link>
  );
}
