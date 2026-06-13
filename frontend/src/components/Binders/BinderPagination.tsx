import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BinderPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const BinderPagination: React.FC<BinderPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-4 mt-8 md:hidden">
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="p-2 rounded-full bg-white text-black disabled:opacity-50"
      >
        <ChevronLeft size={24} />
      </button>
      <span className="text-white font-[800] uppercase">
        HALAMAN {currentPage + 1} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className="p-2 rounded-full bg-white text-black disabled:opacity-50"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};
