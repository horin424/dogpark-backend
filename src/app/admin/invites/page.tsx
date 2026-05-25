"use client";
import { useEffect, useState } from "react";
import {
    listInvites,
    createInvite,
    revokeInvite,
    unrevokeInvite,
    getCurrentUserId,
    InviteRecord,
} from "@/lib/storage";

export default function AdminInvitesPage() {
    const [invites, setInvites] = useState<InviteRecord[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [note, setNote] = useState("");
    const [customCode, setCustomCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [origin, setOrigin] = useState("");
    const [copied, setCopied] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
        refresh();
    }, []);

    const refresh = async () => {
        try {
            const list = await listInvites();
            setInvites(list);
        } catch (err) {
            console.error("load invites failed", err);
        } finally {
            setLoaded(true);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError("");
        try {
            const result = await createInvite({
                code: customCode || undefined,
                note: note || undefined,
                createdBy: getCurrentUserId() ?? undefined,
            });
            if (!result.ok) {
                setCreateError(
                    result.error === "taken"
                        ? "そのコードは既に使われています"
                        : "コードの形式が正しくありません（英数字とハイフンのみ、3〜32文字）",
                );
                return;
            }
            setNote("");
            setCustomCode("");
            await refresh();
        } catch (err) {
            console.error(err);
            setCreateError("作成に失敗しました");
        } finally {
            setCreating(false);
        }
    };

    const buildLink = (code: string) =>
        `${origin || ""}/signup?invite=${encodeURIComponent(code)}`;

    const handleCopy = async (code: string) => {
        try {
            await navigator.clipboard.writeText(buildLink(code));
            setCopied(code);
            setTimeout(() => setCopied(""), 1500);
        } catch (err) {
            console.error("copy failed", err);
        }
    };

    const handleRevoke = async (code: string) => {
        await revokeInvite(code);
        await refresh();
    };

    const handleUnrevoke = async (code: string) => {
        await unrevokeInvite(code);
        await refresh();
    };

    const dynamicCount = invites.filter((i) => !i.builtIn).length;
    const activeCount = invites.filter((i) => !i.revoked).length;

    return (
        <div className="py-5 flex flex-col gap-5">
            <div>
                <h1 className="text-xl font-bold text-gray-800">🎫 招待コード管理</h1>
                <p className="text-xs text-gray-400 mt-1">
                    招待リンクを発行・無効化します。リンクは /signup?invite=コード の形式です。
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Stat label="全コード" value={invites.length} />
                <Stat label="有効" value={activeCount} />
                <Stat label="動的発行" value={dynamicCount} />
            </div>

            <form
                onSubmit={handleCreate}
                className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex flex-col gap-3"
            >
                <p className="text-sm font-bold text-gray-700">新しい招待を発行</p>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        メモ（任意）
                    </label>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="例: 田中さん用"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        コードを指定（任意・空欄で自動生成）
                    </label>
                    <input
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="WAN-XXXXXX"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400 font-mono"
                    />
                </div>
                {createError && (
                    <p className="text-red-500 text-xs">{createError}</p>
                )}
                <button
                    type="submit"
                    disabled={creating}
                    className="bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                    {creating ? "発行中…" : "発行する"}
                </button>
            </form>

            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                {!loaded ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        読み込み中…
                    </div>
                ) : invites.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        招待コードがありません
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-amber-50 text-gray-500">
                                <tr>
                                    <th className="text-left px-3 py-2 font-semibold">コード</th>
                                    <th className="text-left px-3 py-2 font-semibold">種別</th>
                                    <th className="text-left px-3 py-2 font-semibold">メモ</th>
                                    <th className="text-left px-3 py-2 font-semibold">状態</th>
                                    <th className="text-right px-3 py-2 font-semibold">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map((inv) => (
                                    <tr
                                        key={inv.code}
                                        className="border-t border-amber-50 hover:bg-amber-50/40"
                                    >
                                        <td className="px-3 py-2 font-mono text-gray-800">
                                            {inv.code}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full font-medium ${
                                                    inv.builtIn
                                                        ? "bg-gray-100 text-gray-600"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                            >
                                                {inv.builtIn ? "組込" : "動的"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                            {inv.note ?? ""}
                                        </td>
                                        <td className="px-3 py-2">
                                            {inv.revoked ? (
                                                <span className="text-red-600 font-medium">無効</span>
                                            ) : (
                                                <span className="text-green-600 font-medium">有効</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(inv.code)}
                                                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                                                >
                                                    {copied === inv.code ? "✓ コピー済" : "リンクをコピー"}
                                                </button>
                                                {!inv.builtIn &&
                                                    (inv.revoked ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnrevoke(inv.code)}
                                                            className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-amber-300"
                                                        >
                                                            復元
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRevoke(inv.code)}
                                                            className="px-2 py-1 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                                        >
                                                            無効化
                                                        </button>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
                組込コードはソースコード（src/data/mockData.ts）に書かれており、ここからは無効化できません。
                動的コードは Firestore の <code>invites</code> コレクションに保存されます。
            </p>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    );
}
