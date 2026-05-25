"use client";
import { useEffect, useRef } from "react";
import { todayString } from "@/lib/storage";

/**
 * Keeps `selectedDate` aligned with the real "today" when the tab regains
 * focus. Without this, a tab left open overnight keeps showing yesterday's
 * date as "today" — the client reported this on the home screen.
 *
 * Only re-syncs when the user is *already* viewing today (i.e. they haven't
 * manually picked a future date), so we don't yank them off a chosen day.
 */
export function useTodayResync(
    selectedDate: string,
    setSelectedDate: (d: string) => void,
): void {
    const lastTodayRef = useRef<string>(selectedDate);
    lastTodayRef.current = selectedDate;

    useEffect(() => {
        const sync = () => {
            const t = todayString();
            // If they were viewing what *was* today, slide them to the new today.
            if (lastTodayRef.current !== t && lastTodayRef.current <= t) {
                setSelectedDate(t);
            }
        };
        const onVisible = () => {
            if (document.visibilityState === "visible") sync();
        };
        window.addEventListener("focus", sync);
        document.addEventListener("visibilitychange", onVisible);
        // Re-check periodically in case the user just leaves the tab open.
        const id = setInterval(sync, 60_000);
        return () => {
            window.removeEventListener("focus", sync);
            document.removeEventListener("visibilitychange", onVisible);
            clearInterval(id);
        };
    }, [setSelectedDate]);
}

/** Calls `callback` every `intervalMs` and on window focus. */
export function usePolling(
    callback: () => void | Promise<void>,
    intervalMs: number,
    enabled = true,
): void {
    const cbRef = useRef(callback);
    cbRef.current = callback;

    useEffect(() => {
        if (!enabled) return;
        let mounted = true;
        const tick = async () => {
            if (!mounted) return;
            try {
                await cbRef.current();
            } catch {
                // Silent — caller decides how to surface errors via toast/log.
            }
        };
        const id = setInterval(tick, intervalMs);
        const onFocus = () => tick();
        window.addEventListener("focus", onFocus);
        return () => {
            mounted = false;
            clearInterval(id);
            window.removeEventListener("focus", onFocus);
        };
    }, [intervalMs, enabled]);
}
