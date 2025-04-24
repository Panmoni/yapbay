interface LoadingIndicatorProps {
  message?: string;
}

/**
 * Loading indicator component for the trade page
 */
export function LoadingIndicator({ message = 'Loading...' }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-center items-center py-16">
      <p className="text-neutral-500">{message}</p>
    </div>
  );
}
