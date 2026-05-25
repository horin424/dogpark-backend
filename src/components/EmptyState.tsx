interface EmptyStateProps {
    emoji?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({
    emoji = "🐾",
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-5xl mb-4">{emoji}</span>
            <p className="font-semibold text-gray-700 text-base mb-1">{title}</p>
            {description && (
                <p className="text-gray-500 text-sm mb-4">{description}</p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
