"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-amber-100/70 rounded animate-pulse ${className}`} />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100/70 animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
                <SkeletonLine className="h-3 w-1/2" />
                <SkeletonLine className="h-3 w-1/3" />
            </div>
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
