interface TradeHeaderProps {
  userRole: string;
}

/**
 * Header component for the trade page that displays the user's role
 */
export function TradeHeader({ userRole }: TradeHeaderProps) {
  return (
    <div className="bg-primary-100 p-3 rounded-md mb-4 text-center">
      <p className="text-primary-800 font-medium">
        Your role in this trade: <span className="font-bold uppercase">{userRole}</span>
      </p>
    </div>
  );
}
