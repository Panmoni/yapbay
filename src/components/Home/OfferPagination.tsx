import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../../components/ui/pagination';

interface OfferPaginationProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
}

const OfferPagination: React.FC<OfferPaginationProps> = ({
  currentPage,
  totalPages,
  handlePageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="py-4 flex justify-center">
      <Pagination>
        <PaginationContent>
          {/* Previous button */}
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
              />
            </PaginationItem>
          )}

          {/* First page */}
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={currentPage === 1}
              onClick={e => {
                e.preventDefault();
                handlePageChange(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>

          {/* Ellipsis if needed */}
          {currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Pages around current page */}
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNumber = i + 1;
            // Show current page and one page before and after (if they exist)
            if (
              pageNumber !== 1 &&
              pageNumber !== totalPages &&
              (pageNumber === currentPage ||
                pageNumber === currentPage - 1 ||
                pageNumber === currentPage + 1)
            ) {
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === currentPage}
                    onClick={e => {
                      e.preventDefault();
                      handlePageChange(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })}

          {/* Ellipsis if needed */}
          {currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Last page (if not the first page) */}
          {totalPages > 1 && (
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive={currentPage === totalPages}
                onClick={e => {
                  e.preventDefault();
                  handlePageChange(totalPages);
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Next button */}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={e => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default OfferPagination;
