import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Account } from "../api";

interface ChatSectionProps {
  counterparty: Account | null;
}

function ChatSection({ counterparty }: ChatSectionProps) {
  return (
    <Card className="border border-neutral-200 shadow-sm p-4">
      <CardHeader>
        <CardTitle className="text-[#5b21b6]">Chat</CardTitle>
        <CardDescription>Communicate with your trading partner</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 border border-neutral-100 rounded-md p-4">
          <p className="text-neutral-500 mb-4">Chat functionality coming soon</p>
          {counterparty?.telegram_username && (
            <Button
              onClick={() => window.open(`https://t.me/${counterparty.telegram_username}`, '_blank')}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white"
            >
              <svg className="w-6 h-6 mr-1" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="currentColor"/>
              </svg>
              Message on Telegram
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ChatSection;
