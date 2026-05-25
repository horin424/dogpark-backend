"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUserId,
  loginWithPassword,
  seedDemoData,
} from "@/lib/storage";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
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
      const next = p.next || "/";
      setNextPath(next);
      if (getCurrentUserId()) {
        router.replace(next);
      }
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
    </div>
  );
}
