import { Park, User } from "@/types";

export const MOCK_PARKS: Park[] = [
    {
        id: "park-1",
        name: "代々木ドッグラン",
        address: "東京都渋谷区代々木神園町",
        distanceKm: 0.8,
        openTime: "09:00",
        closeTime: "18:00",
        hasParkingLot: true,
        fee: "無料",
        requiresCertificate: true,
        notes: "狂犬病・混合ワクチン接種証明書が必要です。大型犬・小型犬エリア分離。",
        imageEmoji: "🌳",
    },
    {
        id: "park-2",
        name: "駒沢ドッグラン",
        address: "東京都世田谷区駒沢公園1-1",
        distanceKm: 1.5,
        openTime: "06:00",
        closeTime: "21:00",
        hasParkingLot: true,
        fee: "年会費制 ¥1,000",
        requiresCertificate: true,
        notes: "年会費登録制。タグの装着が必須。",
        imageEmoji: "🏞️",
    },
    {
        id: "park-3",
        name: "砧公園ドッグラン",
        address: "東京都世田谷区砧公園1",
        distanceKm: 2.3,
        openTime: "08:00",
        closeTime: "17:00",
        hasParkingLot: true,
        fee: "無料",
        requiresCertificate: true,
        notes: "登録制。混雑時は入場制限あり。",
        imageEmoji: "🌿",
    },
    {
        id: "park-4",
        name: "明治公園ドッグラン",
        address: "東京都新宿区霞ケ丘町",
        distanceKm: 3.1,
        openTime: "09:00",
        closeTime: "16:30",
        hasParkingLot: false,
        fee: "無料",
        requiresCertificate: false,
        notes: "ノーリード可エリアあり。日曜は混雑します。",
        imageEmoji: "🏡",
    },
];

export const MOCK_USERS = [
    {
        id: "user-demo",
        displayName: "はなこ",
        friendCode: "WOOF-1234",
        pin: "1234",
        dogs: [
            {
                id: "dog-1",
                name: "モカ",
                breed: "トイプードル",
                size: "small" as const,
                tags: ["きゃわいい", "元気", "社交的"],
                avatarEmoji: "🐩",
            },
        ],
    },
    {
        id: "user-2",
        displayName: "けんた",
        friendCode: "BARK-5678",
        pin: "5678",
        dogs: [
            {
                id: "dog-2",
                name: "レオ",
                breed: "ゴールデンレトリバー",
                size: "large" as const,
                tags: ["おだやか", "人懐こい"],
                avatarEmoji: "🐕",
            },
        ],
    },
    {
        id: "user-3",
        displayName: "さくら",
        friendCode: "PAW-9012",
        pin: "9012",
        dogs: [
            {
                id: "dog-3",
                name: "はな",
                breed: "柴犬",
                size: "medium" as const,
                tags: ["クール", "マイペース", "臆病"],
                avatarEmoji: "🐕‍🦺",
            },
        ],
    },
];

export const DEMO_USER_ID = "user-demo";

