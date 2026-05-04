"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getCurrentUserId,
    getUsers,
    saveUsers,
    getCurrentUser,
    getProfileByFriendCode,
    updateProfile,
} from "@/lib/storage";

import { Dog, DogSize, User } from "@/types";
import { useToast } from "@/components/Toast";

const SIZE_OPTIONS: { value: DogSize; label: string }[] = [
    { value: "small", label: "小型 (〜10kg)" },
    { value: "medium", label: "中型 (10〜25kg)" },
    { value: "large", label: "大型 (25kg〜)" },
];

const PERSONALITY_TAGS = [
    "元気", "おだやか", "社交的", "臆病", "マイペース", "人懐こい",
    "クール", "やんちゃ", "おとなしい", "遊ぶのが好き",
];

const DOG_EMOJIS = ["🐕", "🐩", "🐕‍🦺", "🦮", "🐶"];

function newDog(): Dog {
    return {
        id: Math.random().toString(36).slice(2),
        name: "",
        breed: "",
        size: "small",
        tags: [],
        avatarEmoji: "🐕",
    };
}

export default function EditProfilePage() {
    const router = useRouter();
    const { showToast, ToastElement } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [dogs, setDogs] = useState<Dog[]>([]);

    useEffect(() => {
        const uid = getCurrentUserId();
        if (!uid) {
            router.replace("/login?next=/me/edit");
            return;
        }
        const u = getCurrentUser();
        if (u) {
            setUser(u);
            const profiles = getProfileByFriendCode(u.friendCode);
            setDogs(u.dogs.length > 0 ? u.dogs : [newDog()]);
            if (profiles) {
                setCustomTag(""); // Reset custom tag state
            }
        }
    }, [router]);

    const [customTag, setCustomTag] = useState("");


    const updateDog = <K extends keyof Dog>(idx: number, key: K, val: Dog[K]) => {
        setDogs((prev) => prev.map((d, i) => (i === idx ? { ...d, [key]: val } : d)));
    };

    const toggleTag = (idx: number, tag: string) => {
        setDogs((prev) =>
            prev.map((d, i) => {
                if (i !== idx) return d;
                const isSelected = d.tags.includes(tag);
                if (!isSelected && d.tags.length >= 3) {
                    showToast("タグは最大3つまでです");
                    return d;
                }
                const tags = isSelected
                    ? d.tags.filter((t) => t !== tag)
                    : [...d.tags, tag];
                return { ...d, tags };
            })
        );
    };

    const handlePhotoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit for localStorage
            showToast("画像サイズは1MB未満にしてください");
            return;
        }

        const reader = new FileReader();
        reader.onload = (upload) => {
            const dataUrl = upload.target?.result as string;
            updateDog(idx, "photoUrl", dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const addCustomTag = (idx: number) => {
        const tag = customTag.trim();
        if (!tag) return;
        if (dogs[idx].tags.includes(tag)) {
            setCustomTag("");
            return;
        }
        if (dogs[idx].tags.length >= 3) {
            showToast("タグは最大3つまでです");
            return;
        }
        updateDog(idx, "tags", [...dogs[idx].tags, tag]);
        setCustomTag("");
    };


    const addDog = () => setDogs((prev) => [...prev, newDog()]);
    const removeDog = (idx: number) =>
        setDogs((prev) => prev.filter((_, i) => i !== idx));

    const handleSave = () => {
        if (!user) return;
        const invalid = dogs.find((d) => !d.name.trim());
        if (invalid) {
            showToast("犬の名前を入力してください");
            return;
        }
        const users = getUsers();
        const updated = users.map((u) =>
            u.id === user.id ? { ...u, dogs } : u
        );
        saveUsers(updated);

        // Also update central profile (main dog)
        if (dogs.length > 0) {
            updateProfile(user.friendCode, {
                dogName: dogs[0].name,
                photoDataUrl: dogs[0].photoUrl,
                tags: dogs[0].tags,
                avatarEmoji: dogs[0].avatarEmoji,
            });
        }

        showToast("✅ 保存しました");
        setTimeout(() => router.push("/me"), 800);
    };


    if (!user) return null;

    return (
        <div className="py-5 flex flex-col gap-5">
            {ToastElement}
            <h1 className="text-xl font-bold text-gray-800">🐾 プロフィール編集</h1>

            {dogs.map((dog, idx) => (
                <div key={dog.id} className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-700 text-sm">
                            ワンちゃん {idx + 1}
                        </h2>
                        {dogs.length > 1 && (
                            <button
                                onClick={() => removeDog(idx)}
                                className="text-xs text-red-400 border border-red-200 px-3 py-1 rounded-full"
                            >
                                削除
                            </button>
                        )}
                    </div>

                    {/* Photo upload */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-2 block">写真（丸型に切り抜かれます）</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {dog.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={dog.photoUrl} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">{dog.avatarEmoji}</span>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(idx, e)}
                                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">※ 写真をアップロードすると、絵文字より優先して表示されます。</p>
                    </div>

                    {/* Emoji picker (if no photo) */}
                    {!dog.photoUrl && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-2 block">または絵文字を選択</label>
                            <div className="flex gap-2">
                                {DOG_EMOJIS.map((e) => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => updateDog(idx, "avatarEmoji", e)}
                                        className={`text-3xl p-1.5 rounded-xl transition-colors ${dog.avatarEmoji === e ? "bg-amber-100 border-2 border-amber-400" : "border-2 border-transparent"}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">犬の名前 *</label>
                        <input
                            value={dog.name}
                            onChange={(e) => updateDog(idx, "name", e.target.value)}
                            placeholder="例: モカ"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Breed */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">犬種（任意）</label>
                        <input
                            value={dog.breed ?? ""}
                            onChange={(e) => updateDog(idx, "breed", e.target.value)}
                            placeholder="例: トイプードル"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Size */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-2 block">サイズ</label>
                        <div className="flex gap-2">
                            {SIZE_OPTIONS.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => updateDog(idx, "size", s.value)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors ${dog.size === s.value ? "bg-amber-500 text-white" : "bg-amber-50 text-gray-600 border border-amber-100"}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Personality tags */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-2 block">性格タグ（最大3つ）</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {PERSONALITY_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(idx, tag)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${dog.tags.includes(tag)
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "bg-white text-gray-600 border-gray-200"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        {/* Custom tag */}
                        <div className="flex gap-2">
                            <input
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                placeholder="カスタムタグ（例: 食いしん坊）"
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomTag(idx);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => addCustomTag(idx)}
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {dog.tags.filter(t => !PERSONALITY_TAGS.includes(t)).map(t => (
                                <span key={t} className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                    {t}
                                    <button onClick={() => toggleTag(idx, t)} className="text-amber-300 hover:text-amber-500">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                </div>
            ))}

            <button
                onClick={addDog}
                className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-amber-200 text-amber-500 py-3 rounded-2xl text-sm font-semibold hover:border-amber-400 transition-colors"
            >
                ＋ ワンちゃんを追加
            </button>

            <button
                onClick={handleSave}
                className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-amber-600 transition-colors"
            >
                保存する
            </button>
        </div>
    );
}
