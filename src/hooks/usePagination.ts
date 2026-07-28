import { useState, useMemo } from 'react';

interface UsePaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  paginatedItems: T[];
  startEntryIndex: number;
  endEntryIndex: number;
  totalCount: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setPageSize: (size: number) => void;
}

export function usePagination<T>(
  items: T[],
  initialPageSize: number = 8
): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalCount = items.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const startEntryIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntryIndex = Math.min(currentPage * pageSize, totalCount);

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    startEntryIndex,
    endEntryIndex,
    totalCount,
    setCurrentPage,
    setPageSize,
  };
}
