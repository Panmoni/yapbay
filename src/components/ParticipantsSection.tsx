import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ParticipantCard from "./ParticipantCard";
import { Account, Trade } from "../api";

interface ParticipantsSectionProps {
  buyerAccount: Account | null;
  sellerAccount: Account | null;
  currentAccount: Account | null;
  creator: Account | null;
  trade: Trade;
  userRole: 'buyer' | 'seller';
}

function ParticipantsSection({
  buyerAccount,
  sellerAccount,
  currentAccount,
  creator,
  trade,
  userRole
}: ParticipantsSectionProps) {
  return (
    <Card className="border border-gray-200 shadow-sm p-4">
      <CardHeader>
        <CardTitle className="text-[#5b21b6]">Participants</CardTitle>
        <CardDescription>People involved in this trade</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Show buyer */}
        <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
          {(() => {
            console.log("[DEBUG] Rendering buyer card:", {
              buyerAccount,
              currentAccountId: currentAccount?.id,
              userRole,
              isCreatorBuyer: creator?.id === trade.leg1_buyer_account_id
            });
            return null;
          })()}
          <ParticipantCard
            user={buyerAccount}
            role="Buyer"
            isCurrentUser={currentAccount?.id === buyerAccount?.id}
            isOfferCreator={creator?.id === buyerAccount?.id}
            isBuyer={true}
          />
        </div>

        {/* Show seller */}
        <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
          {(() => {
            console.log("[DEBUG] Rendering seller card:", {
              sellerAccount,
              currentAccountId: currentAccount?.id,
              userRole,
              isCreatorSeller: creator?.id === trade.leg1_seller_account_id
            });
            return null;
          })()}
          <ParticipantCard
            user={sellerAccount}
            role="Seller"
            isCurrentUser={currentAccount?.id === sellerAccount?.id}
            isOfferCreator={creator?.id === sellerAccount?.id}
            isSeller={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default ParticipantsSection;
