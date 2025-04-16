import { Account } from "../api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ParticipantCardProps {
  user: Account | null;
  role: string;
  isCurrentUser?: boolean;
  isBuyer?: boolean;
  isSeller?: boolean;
  isOfferCreator?: boolean;
}

function ParticipantCard({
  user,
  role,
  isCurrentUser = false,
  isBuyer = false,
  isSeller = false,
  isOfferCreator = false
}: ParticipantCardProps) {
  if (!user) return <p>Unknown {role}</p>;

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="w-24 h-24">
        <AvatarImage src={user.profile_photo_url || "/icon96.png"} alt={user.username || "User"} />
        <AvatarFallback className="text-xl">
          {user.username?.[0]?.toUpperCase() || user.wallet_address?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium">{user.username || user.wallet_address}</p>
          {isCurrentUser && (
            <Badge variant="secondary" className="bg-[#6d28d9] text-white text-xs">
              YOU
            </Badge>
          )}
          {isBuyer && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
              BUYER
            </Badge>
          )}
          {isSeller && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
              SELLER
            </Badge>
          )}
          {isOfferCreator && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
              OFFER CREATOR
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">User ID: {user.id}</p>
        {user.telegram_username && (
          <a
            href={`https://t.me/${user.telegram_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 flex items-center mt-1 text-sm"
          >
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
            <path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="currentColor"/>
            </svg>
            Message on Telegram
          </a>
        )}
      </div>
    </div>
  );
}

export default ParticipantCard;
