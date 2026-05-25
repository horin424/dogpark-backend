"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import Link from "next/link";
import {
  getCurrentUserId,
  loginWithPassword,
=======
import {
  getCurrentUserId,
  loginWithPin,
  getUsers,
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
  seedDemoData,
} from "@/lib/storage";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
<<<<<<< HEAD
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        await seedDemoData();
      } catch (err) {
        console.error("seed failed", err);
      }
      if (canceled) return;
      setMounted(true);
      const p = await searchParams;
=======
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
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
      const next = p.next || "/";
      setNextPath(next);
      if (getCurrentUserId()) {
        router.replace(next);
      }
<<<<<<< HEAD
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const userId = await loginWithPassword(accountId, password);
      if (!userId) {
        setError("アカウントIDまたはパスワードが違います");
        return;
      }
      router.replace(nextPath);
    } catch (err) {
      console.error(err);
      setError("ログインに失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
=======
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
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
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
<<<<<<< HEAD
          アカウントIDとパスワードでログインします
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white rounded-2xl border border-amber-100 shadow-sm p-6 flex flex-col gap-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            アカウントID
          </label>
          <input
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="例: tanaka_dog"
            required
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            minLength={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm text-center font-medium">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {submitting ? "ログイン中…" : "ログイン"}
        </button>

        <div className="border-t border-amber-100 pt-4">
          <p className="text-xs text-gray-500 text-center mb-2">
            アカウントをお持ちでない方
          </p>
          <Link
            href="/signup"
            className="block w-full bg-white border-2 border-amber-400 text-amber-600 py-3 rounded-xl font-bold text-sm text-center hover:bg-amber-50 transition-colors"
          >
            アカウント作成
          </Link>
        </div>
      </form>
=======
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
>>>>>>> 16bb157cb2a9d74dca5345d0be0ea2409118efde
    </div>
  );
}
