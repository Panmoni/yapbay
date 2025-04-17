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
    # Primary colors
    sed -i 's/text-\[#5b21b6\]/text-primary-800/g' "$file"
    sed -i 's/bg-\[#5b21b6\]/bg-primary-800/g' "$file"
    sed -i 's/border-\[#5b21b6\]/border-primary-800/g' "$file"
    sed -i 's/hover:bg-\[#5b21b6\]/hover:bg-primary-800/g' "$file"
    sed -i 's/hover:text-\[#5b21b6\]/hover:text-primary-800/g' "$file"
    sed -i 's/hover:border-\[#5b21b6\]/hover:border-primary-800/g' "$file"
    
    # Secondary colors
    sed -i 's/bg-\[#a7f3d0\]/bg-secondary-300/g' "$file"
    sed -i 's/border-\[#a7f3d0\]/border-secondary-300/g' "$file"
    sed -i 's/hover:bg-\[#a7f3d0\]/hover:bg-secondary-300/g' "$file"
    sed -i 's/text-\[#065f46\]/text-secondary-900/g' "$file"
    sed -i 's/bg-\[#d1fae5\]/bg-secondary-200/g' "$file"
    
    # Primary-700 colors
    sed -i 's/text-\[#6d28d9\]/text-primary-700/g' "$file"
    sed -i 's/bg-\[#6d28d9\]/bg-primary-700/g' "$file"
    sed -i 's/border-\[#6d28d9\]/border-primary-700/g' "$file"
    sed -i 's/focus:ring-\[#6d28d9\]/focus:ring-primary-700/g' "$file"
    sed -i 's/focus:border-\[#6d28d9\]/focus:border-primary-700/g' "$file"
    sed -i 's/hover:text-\[#6d28d9\]/hover:text-primary-700/g' "$file"
    sed -i 's/hover:border-\[#6d28d9\]/hover:border-primary-700/g' "$file"
    
    # Additional colors from grep output
    # Purple light/dark (ede9fe/ddd6fe)
    sed -i 's/bg-\[#ede9fe\]/bg-primary-100/g' "$file"
    sed -i 's/hover:bg-\[#ddd6fe\]/hover:bg-primary-200/g' "$file"
    
    # Green colors (10b981/059669)
    sed -i 's/bg-\[#10b981\]/bg-success-500/g' "$file"
    sed -i 's/hover:bg-\[#059669\]/hover:bg-success-600/g' "$file"
    sed -i 's/text-\[#059669\]/text-success-600/g' "$file"
    
    # Neutral background (FAF9F6)
    sed -i 's/bg-\[#FAF9F6\]/bg-neutral-50/g' "$file"
    
    # Blue colors (0088cc/0077b5)
    sed -i 's/bg-\[#0088cc\]/bg-info-500/g' "$file"
    sed -i 's/hover:bg-\[#0077b5\]/hover:bg-info-600/g' "$file"
    sed -i 's/text-\[#0088cc\]/text-info-500/g' "$file"
    sed -i 's/hover:text-\[#0077b5\]/hover:text-info-600/g' "$file"
    
    # Purple focus (8b5cf6)
    sed -i 's/focus:ring-\[#8b5cf6\]/focus:ring-primary-500/g' "$file"
    sed -i 's/focus:border-\[#8b5cf6\]/focus:border-primary-500/g' "$file"
    
    # Special case for hover:text-[#7c3aed]
    sed -i 's/hover:text-\[#7c3aed\]/hover:text-primary-600/g' "$file"
    
    echo "Processed $file"
  else
    echo "File not found: $file"
  fi
done

echo "Color replacements complete!"
