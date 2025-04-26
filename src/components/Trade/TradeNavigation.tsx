import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Navigation component for the trade page
 */
export function TradeNavigation() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end p-4">
      <Button
        onClick={() => navigate('/trades')}
        className="bg-primary-500 hover:bg-primary-600 text-white"
      >
        View All My Trades
      </Button>
    </div>
  );
}
