import { useState, useCallback } from 'react';

interface UseBulkSelectionResult {
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  isAllPageSelected: (pageItems: Array<{ id: string }>) => boolean;
  handleSelectAllToggle: (pageItems: Array<{ id: string }>) => void;
  handleSelectRow: (id: string) => void;
  clearSelection: () => void;
}

export function useBulkSelection(): UseBulkSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllPageSelected = useCallback((pageItems: Array<{ id: string }>) => {
    if (pageItems.length === 0) return false;
    return pageItems.every((item) => selectedIds.has(item.id));
  }, [selectedIds]);

  const handleSelectAllToggle = useCallback((pageItems: Array<{ id: string }>) => {
    const newSelected = new Set(selectedIds);
    if (isAllPageSelected(pageItems)) {
      pageItems.forEach((item) => newSelected.delete(item.id));
    } else {
      pageItems.forEach((item) => newSelected.add(item.id));
    }
    setSelectedIds(newSelected);
  }, [selectedIds, isAllPageSelected]);

  const handleSelectRow = useCallback((id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    isAllPageSelected,
    handleSelectAllToggle,
    handleSelectRow,
    clearSelection,
  };
}
