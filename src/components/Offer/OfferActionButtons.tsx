import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OfferActionButtonsProps {
  offerId: number;
  onDelete: (offerId: number) => void;
  isMobile?: boolean;
  isDeleting?: boolean; // Add isDeleting prop
}

function OfferActionButtons({
  offerId,
  onDelete,
  isMobile = false,
  isDeleting = false, // Default to false
}: OfferActionButtonsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    onDelete(offerId);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className={`flex gap-2 justify-center ${isMobile ? 'mt-4' : ''}`}>
        <Link to={`/offer/${offerId}`} className={isMobile ? 'flex-1' : ''}>
          <Button
            variant="outline"
            className="border-primary-700 text-primary-700 hover:text-primary-800 hover:border-primary-800 w-full h-8 px-2"
            aria-label="View offer"
            title="View offer"
          >
            <Eye size={16} />
          </Button>
        </Link>
        <Link to={`/edit-offer/${offerId}`} className={isMobile ? 'flex-1' : ''}>
          <Button
            variant="outline"
            className="border-primary-700 text-primary-700 hover:text-primary-800 hover:border-primary-800 w-full h-8 px-2"
            aria-label="Edit offer"
            title="Edit offer"
          >
            <Pencil size={16} />
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={openDeleteDialog}
          className={`border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-8 px-2 ${
            isMobile ? 'flex-1' : ''
          } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Delete offer"
          title="Delete offer"
          disabled={isDeleting} // Disable button when deleting
        >
          {isDeleting ? '...' : <Trash2 size={16} />} {/* Show indicator */}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-neutral-100 z-999">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className={`bg-red-500 hover:bg-red-600 text-white ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isDeleting} // Disable confirmation button too
            >
              {isDeleting ? 'Deleting...' : 'Delete Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OfferActionButtons;
