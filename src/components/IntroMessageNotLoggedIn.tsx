import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const IntroMessageNotLoggedIn = () => {
  const { setShowAuthFlow } = useDynamicContext();
  return (
    <Card className="my-4 border-[#6d28d9] border-2">
      <CardContent className="px-4 py-2 sm:py-2">
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          <div className="bg-[#ede9fe] p-3 sm:p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6d28d9"
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#5b21b6] mb-2">
              Welcome to LocalSolana P2P Trading
            </h2>
            <p className="text-neutral-600 mb-4 text-sm sm:text-base">
              Trade USDC on Solana directly with other users anywhere in the world. Buy and sell using any fiat payment method with our on-chain escrow system. Get <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="text-[#6d28d9] underline">devnet SOL</a> and <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="text-[#6d28d9] underline">devnet USDC</a> to test LocalSolana. Get support in <a href="https://t.me/Panmoni/802" target="_blank" rel="noopener noreferrer" className="text-[#6d28d9] underline">English</a> or <a href="https://t.me/Panmoni/804" target="_blank" rel="noopener noreferrer" className="text-[#6d28d9] underline">Español</a>.
            </p>
            <Button
              onClick={() => setShowAuthFlow(true)}
              className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white w-full md:w-auto"
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
