// components/ui/CirclePagination.jsx
import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Button from "./ui/Button";

const CirclePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50], // Default options
  showPageSizeOptions = true,
  className = "",
  totalItems = 0, // Add totalItems prop
}) => {
  // Filter pageSizeOptions to only include values <= totalItems
  const filteredPageSizeOptions = pageSizeOptions.filter(
    (option) => totalItems === 0 || option <= totalItems
  );

  // Ensure at least one page size option is available (fallback to smallest option or 10)
  const validPageSizeOptions =
    filteredPageSizeOptions.length > 0 ? filteredPageSizeOptions : [10];

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisiblePages = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(currentPage - halfVisiblePages, 1);
      let endPage = Math.min(currentPage + halfVisiblePages, totalPages);

      if (currentPage <= halfVisiblePages) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - halfVisiblePages) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      if (startPage > 1) pages.push(1);
      if (startPage > 2) pages.push("...");

      for (let i = startPage; i <= endPage; i++) pages.push(i);

      if (endPage < totalPages - 1) pages.push("...");
      if (endPage < totalPages) pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {showPageSizeOptions && validPageSizeOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-neutral-200 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white appearance-none"
          >
            {validPageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-full hover:bg-neutral-100"
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="w-8 h-8 flex items-center justify-center text-neutral-400">
                  ...
                </span>
              ) : (
                <Button
                  variant={page === currentPage ? "primary" : "ghost"}
                  size="icon"
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-full ${
                    page === currentPage
                      ? "bg-primary text-white"
                      : "hover:bg-neutral-100"
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-full hover:bg-neutral-100"
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default CirclePagination;