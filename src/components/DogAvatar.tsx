"use client";
import { useEffect, useState } from "react";
import { fetchProfileByFriendCode, DogProfile } from "@/lib/storage";

interface DogAvatarProps {
    friendCode?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const SIZE_MAP = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-2xl",
    lg: "w-12 h-12 text-3xl",
    xl: "w-16 h-16 text-4xl",
};

export default function DogAvatar({ friendCode, size = "md", className = "" }: DogAvatarProps) {
    const [profile, setProfile] = useState<DogProfile | null>(null);
    const sizeClass = SIZE_MAP[size];

    useEffect(() => {
        if (!friendCode) return;
        let canceled = false;
        (async () => {
            try {
                const p = await fetchProfileByFriendCode(friendCode);
                if (!canceled) setProfile(p ?? null);
            } catch {
                if (!canceled) setProfile(null);
            }
        })();
        return () => {
            canceled = true;
        };
    }, [friendCode]);

    if (profile?.photoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={profile.photoUrl}
                alt={profile.dogName || "dog"}
                className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-amber-100 ${className}`}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center flex-shrink-0 ${className}`}
            aria-label={profile?.dogName || "dog"}
        >
            <span>{profile?.avatarEmoji || "🐕"}</span>
        </div>
    );
}
