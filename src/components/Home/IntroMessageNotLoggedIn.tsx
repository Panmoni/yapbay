import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const IntroMessageNotLoggedIn = () => {
  const { setShowAuthFlow } = useDynamicContext();
  return (
    <Card className="my-4 border-primary-600 border-2">
      <CardContent className="px-4 py-2 sm:py-2">
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          <div className="bg-neutral-100 p-3 sm:p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2b6cb0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">
              Welcome to YapBay P2P Trading
            </h2>
            <p className="text-neutral-600 mb-4 text-sm sm:text-base">
              Trade USDC on YapBay directly with other users anywhere in the world. Buy and sell
              using any fiat payment method with our on-chain escrow system. Test on Solana Devnet
              with devnet SOL and USDC. Get {''}
              <a
                href="https://faucet.solana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                Devnet SOL
              </a>{' '}
              and{' '}
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                Solana Devnet USDC
              </a>
              . Access support in{' '}
              <a
                href="https://t.me/Panmoni/288"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                English
              </a>{' '}
              or{' '}
              <a
                href="https://t.me/Panmoni/291"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                Español
              </a>
              .
            </p>
            <Button
              onClick={() => setShowAuthFlow(true)}
              className="bg-primary-600 hover:bg-primary-900 text-white w-full md:w-auto"
            >
              Connect Your Wallet to Get Started
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntroMessageNotLoggedIn;
