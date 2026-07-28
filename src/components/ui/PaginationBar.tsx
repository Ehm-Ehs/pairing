import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface PaginationBarProps {
  totalCount: number;
  startEntryIndex: number;
  endEntryIndex: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationBar({
  totalCount,
  startEntryIndex,
  endEntryIndex,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  if (totalCount === 0) return null;

  return (
    <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
      {/* Left Info */}
      <span className="text-xs font-semibold text-gray-400">
        Show {startEntryIndex}-{endEntryIndex} of {totalCount} entries
      </span>

      {/* Center Page Indicators */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1.5"
        >
          <FaChevronLeft className="w-2.5 h-2.5" />
          Previous
        </button>
        <span className="text-xs font-bold text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1.5"
        >
          Next
          <FaChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Right Page Size Dropdown */}
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          className="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-bold text-gray-600 outline-none cursor-pointer appearance-none pr-8 select-none shadow-sm hover:border-gray-300 transition-colors"
        >
          <option value={8}>Show 8 entries</option>
          <option value={12}>Show 12 entries</option>
          <option value={24}>Show 24 entries</option>
          <option value={50}>Show 50 entries</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
