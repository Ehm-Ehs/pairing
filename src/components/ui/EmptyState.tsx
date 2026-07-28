interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
      <div className="w-28 h-28 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <line x1="12" y1="10" x2="16" y2="10" />
          <line x1="12" y1="14" x2="16" y2="14" />
          <line x1="12" y1="18" x2="16" y2="18" />
          <circle cx="8.5" cy="10" r="0.75" fill="#828282" />
          <circle cx="8.5" cy="14" r="0.75" fill="#828282" />
          <circle cx="8.5" cy="18" r="0.75" fill="#828282" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">
        {message}
      </p>
      {subMessage && (
        <p className="text-xs font-medium text-gray-400 mt-2">
          {subMessage}
        </p>
      )}
    </div>
  );
}
