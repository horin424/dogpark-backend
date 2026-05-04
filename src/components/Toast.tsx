"use client";
import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [onClose, duration]);

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg z-50 text-sm font-medium animate-fade-in-up whitespace-nowrap">
            {message}
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => setToast(msg);
    const hideToast = () => setToast(null);
    const ToastElement = toast ? (
        <Toast message={toast} onClose={hideToast} />
    ) : null;
    return { showToast, ToastElement };
}
