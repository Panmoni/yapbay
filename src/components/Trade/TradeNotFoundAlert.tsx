import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Alert component displayed when a trade is not found
 */
export function TradeNotFoundAlert() {
  return (
    <Alert className="mb-4 border-yellow-300 bg-yellow-50">
      <AlertDescription className="text-primary-700">
        Trade not found or you don't have permission to view it.
      </AlertDescription>
    </Alert>
  );
}
