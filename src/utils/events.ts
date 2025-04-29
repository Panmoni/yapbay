// Custom event names
export const AUTH_STATE_CHANGE_EVENT = 'yapbay:auth-state-change';
export const TRADE_REFRESH_EVENT = 'yapbay:refresh-trade';
export const TRADE_STATE_CHANGE_EVENT = 'yapbay:trade-state-change';
export const NEW_TRANSACTION_EVENT = 'yapbay:new-transaction';
export const CRITICAL_STATE_CHANGE_EVENT = 'yapbay:critical-state-change';

// Helper function to dispatch auth state change events
export const dispatchAuthStateChange = (walletAddress?: string) => {
  const event = new CustomEvent(AUTH_STATE_CHANGE_EVENT, {
    detail: { 
      authenticated: !!walletAddress,
      walletAddress,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};

// Helper function to dispatch trade refresh events
export const dispatchTradeRefresh = (tradeId: number) => {
  const event = new CustomEvent(TRADE_REFRESH_EVENT, {
    detail: { 
      tradeId,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};

// Helper function to dispatch trade state change events
export const dispatchTradeStateChange = (tradeId: number, newState: number) => {
  const event = new CustomEvent(TRADE_STATE_CHANGE_EVENT, {
    detail: { 
      tradeId,
      newState,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};

// Helper function to dispatch new transaction events
export const dispatchNewTransaction = (tradeId: number, txHash: string) => {
  const event = new CustomEvent(NEW_TRANSACTION_EVENT, {
    detail: { 
      tradeId,
      txHash,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};

// Helper function to dispatch critical state change events
export const dispatchCriticalStateChange = () => {
  const event = new CustomEvent(CRITICAL_STATE_CHANGE_EVENT, {
    detail: { 
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};
