#!/bin/bash

# Define the files to process
FILES=(
  src/AccountPage.tsx
  src/MyEscrowsPage.tsx
  src/EditOfferPage.tsx
  src/TradePage.tsx
  src/MyTradesPage.tsx
  src/Header.tsx
  src/components/TradeConfirmationDialog.tsx
  src/components/TradeDetailsCard.tsx
  src/components/NoOffers.tsx
  src/components/OfferActionButtons.tsx
  src/components/OfferTypeTooltip.tsx
  src/components/FilterBar.tsx
  src/components/ParticipantCard.tsx
  src/components/ChatSection.tsx
  src/components/OfferDescription.tsx
  src/components/ParticipantsSection.tsx
  src/MyOffersPage.tsx
  src/EditAccountForm.tsx
  src/CreateAccountForm.tsx
  src/CreateOfferPage.tsx
  src/OfferDetailPage.tsx
)

# Perform the replacements
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Replace text-[#5b21b6] with text-primary-800
    sed -i 's/text-\[#5b21b6\]/text-primary-800/g' "$file"
    
    # Replace bg-[#5b21b6] with bg-primary-800
    sed -i 's/bg-\[#5b21b6\]/bg-primary-800/g' "$file"
    
    # Replace border-[#5b21b6] with border-primary-800
    sed -i 's/border-\[#5b21b6\]/border-primary-800/g' "$file"
    
    # Replace hover:bg-[#5b21b6] with hover:bg-primary-800
    sed -i 's/hover:bg-\[#5b21b6\]/hover:bg-primary-800/g' "$file"
    
    # Replace hover:text-[#5b21b6] with hover:text-primary-800
    sed -i 's/hover:text-\[#5b21b6\]/hover:text-primary-800/g' "$file"
    
    # Replace hover:border-[#5b21b6] with hover:border-primary-800
    sed -i 's/hover:border-\[#5b21b6\]/hover:border-primary-800/g' "$file"
    
    # Replace bg-[#a7f3d0] with bg-secondary-300
    sed -i 's/bg-\[#a7f3d0\]/bg-secondary-300/g' "$file"
    
    # Replace border-[#a7f3d0] with border-secondary-300
    sed -i 's/border-\[#a7f3d0\]/border-secondary-300/g' "$file"
    
    # Replace hover:bg-[#a7f3d0] with hover:bg-secondary-300
    sed -i 's/hover:bg-\[#a7f3d0\]/hover:bg-secondary-300/g' "$file"
    
    # Replace text-[#065f46] with text-secondary-900
    sed -i 's/text-\[#065f46\]/text-secondary-900/g' "$file"
    
    # Replace bg-[#d1fae5] with bg-secondary-200
    sed -i 's/bg-\[#d1fae5\]/bg-secondary-200/g' "$file"
    
    # Replace text-[#6d28d9] with text-primary-700
    sed -i 's/text-\[#6d28d9\]/text-primary-700/g' "$file"
    
    # Replace bg-[#6d28d9] with bg-primary-700
    sed -i 's/bg-\[#6d28d9\]/bg-primary-700/g' "$file"
    
    # Replace border-[#6d28d9] with border-primary-700
    sed -i 's/border-\[#6d28d9\]/border-primary-700/g' "$file"
    
    # Replace focus:ring-[#6d28d9] with focus:ring-primary-700
    sed -i 's/focus:ring-\[#6d28d9\]/focus:ring-primary-700/g' "$file"
    
    # Replace focus:border-[#6d28d9] with focus:border-primary-700
    sed -i 's/focus:border-\[#6d28d9\]/focus:border-primary-700/g' "$file"
    
    # Replace hover:text-[#6d28d9] with hover:text-primary-700
    sed -i 's/hover:text-\[#6d28d9\]/hover:text-primary-700/g' "$file"
    
    # Replace hover:border-[#6d28d9] with hover:border-primary-700
    sed -i 's/hover:border-\[#6d28d9\]/hover:border-primary-700/g' "$file"
    
    echo "Processed $file"
  else
    echo "File not found: $file"
  fi
done

echo "Color replacements complete!"
