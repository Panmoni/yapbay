import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from './lib/utils';
import {
  useDynamicContext,
  DynamicWidget,
  getAuthToken,
  getNetwork,
  useWalletConnectorEvent,
} from '@dynamic-labs/sdk-react-core';
import { Account, setAuthToken, getPrices } from './api';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/Shared/StatusBadge';
import Container from '@/components/Shared/Container';
import { useBlockchainService } from './hooks/useBlockchainService';

interface HeaderProps {
  isLoggedIn: boolean;
  account: Account | null;
}

function Header({ isLoggedIn, account }: HeaderProps) {
  const { setShowAuthFlow, handleLogOut, primaryWallet } = useDynamicContext();
  const { service: blockchainService, isConnected } = useBlockchainService();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, { price: string; timestamp: number }> | null>(
    null
  );
  const [priceError, setPriceError] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('Loading...');
  const [currentNetwork, setCurrentNetwork] = useState<number | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await getPrices();
      setPrices(response.data.data.USDC);
      setPriceError(null);
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Fetch USDC balance when wallet is connected or network changes
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      console.log('🔍 [DEBUG] Header: fetchUsdcBalance called', {
        isConnected,
        hasPrimaryWallet: !!primaryWallet,
        walletAddress: primaryWallet?.address,
        blockchainServiceWalletAddress: blockchainService.getWalletAddress(),
      });

      if (isConnected && primaryWallet?.address) {
        try {
          console.log('🔍 [DEBUG] Header: Attempting to get wallet balance...');
          const balance = await blockchainService.getWalletBalance();
          // USDC has 6 decimals
          const formattedBalance = (balance / 1_000_000).toFixed(2);
          console.log('🔍 [DEBUG] Header: Balance retrieved successfully:', {
            balance,
            formattedBalance,
          });
          setUsdcBalance(formattedBalance);
        } catch (error) {
          console.error('Error fetching USDC balance:', error);
          setUsdcBalance('Error');
        }
      } else {
        console.log('🔍 [DEBUG] Header: Wallet not connected, showing connect message');
        setUsdcBalance('Connect wallet');
      }
    };

    fetchUsdcBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchUsdcBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, primaryWallet, currentNetwork, blockchainService]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Listen for network changes
  useWalletConnectorEvent(primaryWallet?.connector, 'chainChange', chainInfo => {
    const networkId =
      typeof chainInfo.chain === 'string'
        ? parseInt(chainInfo.chain, 16)
        : parseInt(chainInfo.chain);
    console.log('Network changed detected:', {
      networkId,
      networkName:
        networkId === 42220
          ? 'Celo Mainnet'
          : networkId === 44787
          ? 'Celo Alfajores'
          : 'Unknown Network',
      wallet: primaryWallet?.address,
    });

    if (typeof networkId === 'number' && !isNaN(networkId)) {
      setCurrentNetwork(networkId);
    }
  });

  // Get initial network when wallet connects
  useEffect(() => {
    const getCurrentNetwork = async () => {
      if (primaryWallet?.connector) {
        try {
          const networkId = await getNetwork(primaryWallet.connector);
          if (typeof networkId === 'number') {
            setCurrentNetwork(networkId);
            console.log('Initial network detected:', {
              networkId,
              networkName:
                networkId === 42220
                  ? 'Celo Mainnet'
                  : networkId === 44787
                  ? 'Celo Alfajores'
                  : 'Unknown Network',
            });
          }
        } catch (error) {
          console.error('Error getting initial network:', error);
        }
      }
    };

    getCurrentNetwork();
  }, [primaryWallet]);

  useEffect(() => {
    const token = getAuthToken();
    if (token) setAuthToken(token);
    // console.log(token)
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-neutral-50 shadow-md">
      <Container>
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl sm:text-2xl text-primary-700 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="YapBay Logo"
              className="h-4 sm:h-6 md:h-10 lg:h-12 w-auto max-h-12 rounded-full"
              loading="lazy"
            />
            <h1 className="font-black">YapBay</h1>
            <StatusBadge />
          </Link>

          {priceError ? (
            <div className="hidden md:flex items-center text-red-500 text-sm">
              Price data unavailable
            </div>
          ) : prices ? (
            <div className="hidden md:flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    {Object.entries(prices).map(([currency, priceData]) => (
                      <div key={currency} className="flex flex-col items-center mx-2">
                        <span className="text-xs text-neutral-500">{currency}</span>
                        <span className="text-sm font-medium text-primary-700">
                          {formatNumber(priceData.price)}
                        </span>
                      </div>
                    ))}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-100 text-neutral-800 p-2 rounded-md shadow-lg">
                  USDC market prices update every 15 minutes
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              {['USD', 'COP', 'EUR', 'NGN', 'VES'].map(currency => (
                <div key={currency} className="flex flex-col items-center">
                  <span className="text-xs text-neutral-500">{currency}</span>
                  <span className="text-sm font-medium">...</span>
                </div>
              ))}
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center p-2 rounded-md text-neutral-700 hover:bg-neutral-100 focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <DynamicWidget />
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary-700 transition">
                      <AvatarImage src={account?.profile_photo_url} />
                      <AvatarFallback className="bg-primary-100">
                        <User className="h-6 w-6 text-primary-400" />
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-neutral-50 shadow-md">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/account"
                        className="w-full text-neutral-800 hover:text-primary-700"
                      >
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/offers" className="w-full text-neutral-800 hover:text-primary-700">
                        My Offers
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/trades" className="w-full text-neutral-800 hover:text-primary-700">
                        My Trades
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/escrows"
                        className="w-full text-neutral-800 hover:text-primary-700"
                      >
                        My Escrows
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/transactions"
                        className="w-full text-neutral-800 hover:text-primary-700"
                      >
                        My Transactions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start">
                      <div className="w-full py-1 border-t border-neutral-200 mt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">USDC Balance:</span>
                          <span className="text-sm font-medium text-primary-700">
                            {usdcBalance}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <button
                        onClick={handleLogOut}
                        className="w-full text-left text-neutral-800 hover:text-primary-700"
                      >
                        Log Out
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                className="bg-primary-700 hover:bg-primary-800 text-neutral-100"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 shadow-md">
          <div className="px-4 py-3 space-y-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/account"
                    className="block w-full py-2 text-neutral-800 hover:text-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/offers"
                    className="block w-full py-2 text-neutral-800 hover:text-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Offers
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/trades"
                    className="block w-full py-2 text-neutral-800 hover:text-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Trades
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/escrows"
                    className="block w-full py-2 text-neutral-800 hover:text-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Escrows
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/transactions"
                    className="block w-full py-2 text-neutral-800 hover:text-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Transactions
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-neutral-100">
                  <div className="w-full py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">USDC Balance:</span>
                      <span className="text-sm font-medium text-primary-700">{usdcBalance}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <button
                    onClick={handleLogOut}
                    className="block w-full py-2 text-left text-neutral-800 hover:text-primary-700"
                  >
                    Log Out
                  </button>
                </div>
                <div className="pt-2">
                  <DynamicWidget />
                </div>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowAuthFlow(true);
                  setMobileMenuOpen(false);
                }}
                className="bg-primary-700 hover:bg-primary-800 text-neutral-100 w-full"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
