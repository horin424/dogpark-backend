"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isValidInviteToken, signupWithPassword, seedDemoData } from "@/lib/storage";

const EMOJI_CHOICES = ["🐶", "🐕", "🐩", "🐕‍🦺", "🦮"];

function SignupInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const inviteParam = searchParams.get("invite") ?? "";

    const [inviteToken, setInviteToken] = useState(inviteParam);
    const [accountId, setAccountId] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [dogName, setDogName] = useState("");
    const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [inviteState, setInviteState] = useState<"idle" | "checking" | "ok" | "bad">("idle");

    useEffect(() => {
        seedDemoData().catch((err) => console.error("seed failed", err));
        setMounted(true);
    }, []);

    useEffect(() => {
        const raw = inviteToken.trim();
        if (!raw) {
            setInviteState("idle");
            return;
        }
        setInviteState("checking");
        let canceled = false;
        const t = setTimeout(async () => {
            const ok = await isValidInviteToken(raw);
            if (!canceled) setInviteState(ok ? "ok" : "bad");
        }, 250);
        return () => {
            canceled = true;
            clearTimeout(t);
        };
    }, [inviteToken]);

    if (!mounted) return null;

    const inviteOk = inviteState === "ok";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== password2) {
            setError("パスワードが一致しません");
            return;
        }
        setSubmitting(true);
        try {
            const result = await signupWithPassword({
                accountId,
                password,
                displayName,
                dogName,
                avatarEmoji: emoji,
                inviteToken,
            });
            if (!result.ok) {
                const msg: Record<string, string> = {
                    invalid_invite: "招待コードが無効です",
                    id_taken: "そのアカウントIDは既に使われています",
                    weak_password: "パスワードは6文字以上で入力してください",
                    bad_input: "入力内容を確認してください（IDは英数字3〜20文字）",
                };
                setError(msg[result.error] ?? "登録に失敗しました");
                return;
            }
            router.replace("/");
        } catch (err) {
            console.error(err);
            setError("登録に失敗しました。もう一度お試しください。");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 py-10">
            <div className="text-center">
                <div className="text-5xl mb-3">🐾</div>
                <h1 className="text-2xl font-bold text-amber-700 mb-1">アカウント作成</h1>
                <p className="text-gray-400 text-sm">
                    招待リンクから登録してください
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white rounded-2xl border border-amber-100 shadow-sm p-6 flex flex-col gap-4"
            >
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        招待コード
                    </label>
                    <input
                        value={inviteToken}
                        onChange={(e) => setInviteToken(e.target.value)}
                        placeholder="DOGPARK-MVP-XXX"
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 font-mono"
                    />
                    {inviteState === "checking" && (
                        <p className="text-gray-400 text-xs mt-1">確認中…</p>
                    )}
                    {inviteState === "bad" && (
                        <p className="text-red-500 text-xs mt-1">招待コードが無効です</p>
                    )}
                    {inviteState === "ok" && (
                        <p className="text-green-600 text-xs mt-1">✓ 招待コードを確認しました</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        アカウントID（半角英数字 3〜20文字）
                    </label>
                    <input
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder="例: tanaka_dog"
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 font-mono"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        パスワード（6文字以上）
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        パスワード（確認）
                    </label>
                    <input
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        required
                        minLength={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        ニックネーム
                    </label>
                    <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="例: たなか"
                        required
                        maxLength={20}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        ワンちゃんのお名前
                    </label>
                    <input
                        value={dogName}
                        onChange={(e) => setDogName(e.target.value)}
                        placeholder="例: モカ"
                        required
                        maxLength={20}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        アバター
                    </label>
                    <div className="flex gap-2">
                        {EMOJI_CHOICES.map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => setEmoji(e)}
                                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border transition-colors ${
                                    emoji === e
                                        ? "bg-amber-100 border-amber-400"
                                        : "bg-gray-50 border-gray-200"
                                }`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center font-medium">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting || !inviteOk}
                    className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                    {submitting ? "登録中…" : "アカウントを作成"}
                </button>

                <Link
                    href="/login"
                    className="text-center text-amber-600 text-xs underline"
                >
                    ← ログインに戻る
                </Link>

                <p className="text-[10px] text-gray-400 text-center">
                    ※ 友達コードは登録時に自動で発行されます
                </p>
            </form>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="py-10 text-center text-gray-400">読み込み中...</div>}>
            <SignupInner />
        </Suspense>
    );
}
