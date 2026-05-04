"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUserId,
  loginWithPin,
  getUsers,
  seedDemoData,
} from "@/lib/storage";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [friendCode, setFriendCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupCode, setSetupCode] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupPin2, setSetupPin2] = useState("");
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    // Seed must happen before PIN check
    seedDemoData();
    setMounted(true);
    searchParams.then((p) => {
      const next = p.next || "/";
      setNextPath(next);
      if (getCurrentUserId()) {
        router.replace(next);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const userId = loginWithPin(friendCode, pin);
    if (!userId) {
      setError("コードまたはPINが違います");
      return;
    }
    router.replace(nextPath);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    if (setupPin.length !== 4 || !/^\d{4}$/.test(setupPin)) {
      setSetupError("PINは4桁の数字で入力してください");
      return;
    }
    if (setupPin !== setupPin2) {
      setSetupError("PINが一致しません");
      return;
    }
    const users = getUsers();
    const target = users.find(
      (u) => u.friendCode.toLowerCase() === setupCode.trim().toLowerCase(),
    );
    if (!target) {
      setSetupError("その友達コードは見つかりません");
      return;
    }
    // Set the PIN and login
    const { setPinForUser, login } = require("@/lib/storage");
    setPinForUser(target.id, setupPin);
    login(target.id);
    router.replace(nextPath);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 py-10">
      <div className="text-center">
        <div className="text-5xl mb-3">🐾</div>
        <h1 className="text-2xl font-bold text-amber-700 mb-1">
          ここにいるワン
        </h1>
        <p className="text-gray-400 text-sm">
          友達コードとPINでログインします。
        </p>
      </div>

      {!showSetup ? (
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-2xl border border-amber-100 shadow-sm p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              友達コード
            </label>
            <input
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              placeholder="例: WOOF-1234"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 font-mono tracking-wider"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              4桁PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 tracking-widest text-center text-xl"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
          >
            ログイン
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="text-amber-600 text-xs underline"
            >
              独自のPINを設定したい方はこちら
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-2 bg-amber-50 rounded-xl p-4 text-xs text-amber-700 border border-amber-100 shadow-inner">
            <p className="font-bold mb-2 flex items-center gap-1">
              <span className="text-sm">💡</span> デモ用アカウント
            </p>
            <div className="space-y-1.5 opacity-90">
              <p className="flex justify-between">
                <span>はなこ (モカ):</span>{" "}
                <code className="bg-amber-100 px-1 rounded">
                  WOOF-1234 / 1234
                </code>
              </p>
              <p className="flex justify-between">
                <span>けんた (レオ):</span>{" "}
                <code className="bg-amber-100 px-1 rounded">
                  BARK-5678 / 5678
                </code>
              </p>
              <p className="flex justify-between">
                <span>さくら (はな):</span>{" "}
                <code className="bg-amber-100 px-1 rounded">
                  PAW-9012 &nbsp;/ 9012
                </code>
              </p>
            </div>
            <p className="mt-3 text-[10px] text-amber-500 text-right italic">
              ※ 初回アクセス時に自動登録されます（数秒）
            </p>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleSetup}
          className="w-full max-w-sm bg-white rounded-2xl border border-amber-100 shadow-sm p-6 flex flex-col gap-4"
        >
          <h2 className="font-bold text-gray-800 text-base">PIN を設定する</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              友達コード
            </label>
            <input
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
              placeholder="例: WOOF-1234"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 font-mono tracking-wider"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              新しいPIN（4桁）
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={setupPin}
              onChange={(e) =>
                setSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 tracking-widest text-center text-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              PIN（確認）
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={setupPin2}
              onChange={(e) =>
                setSetupPin2(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 tracking-widest text-center text-xl"
            />
          </div>
          {setupError && (
            <p className="text-red-500 text-sm text-center font-medium">
              {setupError}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
          >
            PINを設定してログイン
          </button>
          <button
            type="button"
            onClick={() => setShowSetup(false)}
            className="text-gray-400 text-xs underline text-center"
          >
            ← ログインに戻る
          </button>
        </form>
      )}
    </div>
  );
}
