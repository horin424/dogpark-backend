// Curated list of breeds common in Japan, used for the breed picker on
// My Page. Keep this list short — the goal is aggregation on the park page,
// not zoological completeness. Users with anything not in here pick
// "その他" and type the breed by hand.
//
// Order roughly follows JKC registration popularity so the most common
// breeds appear near the top of the dropdown.

export const BREED_OPTIONS: string[] = [
    "トイプードル",
    "チワワ",
    "ミニチュアダックスフンド",
    "柴犬",
    "ポメラニアン",
    "ヨークシャーテリア",
    "マルチーズ",
    "シーズー",
    "ミニチュアシュナウザー",
    "パグ",
    "フレンチブルドッグ",
    "キャバリア",
    "ジャックラッセルテリア",
    "パピヨン",
    "ウェルシュコーギー",
    "ビーグル",
    "ボーダーコリー",
    "ゴールデンレトリバー",
    "ラブラドールレトリバー",
    "シベリアンハスキー",
    "バーニーズマウンテンドッグ",
    "秋田犬",
    "プードルミックス",
    "チワワミックス",
    "ダックスミックス",
    "ミックス",
];

export const BREED_OTHER = "その他";

export function isCuratedBreed(breed: string | undefined): boolean {
    if (!breed) return false;
    return BREED_OPTIONS.includes(breed);
}
