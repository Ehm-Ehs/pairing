import { ReactNode } from "react";

export interface TableRowData {
  id: string;
  cells: ReactNode[];
}

interface ParticipantTableProps {
  headers: ReactNode[];
  children?: ReactNode;
  rows?: TableRowData[];
  enableBulkSelection?: boolean;
  isAllPageSelected?: boolean;
  onSelectAllToggle?: () => void;
  selectedIds?: string[];
  onSelectOneToggle?: (id: string) => void;
}

export function ParticipantTable({
  headers,
  children,
  rows,
  enableBulkSelection = false,
  isAllPageSelected = false,
  onSelectAllToggle,
  selectedIds = [],
  onSelectOneToggle,
}: ParticipantTableProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider select-none">
            {enableBulkSelection && (
              <th className="px-6 py-3.5 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={onSelectAllToggle}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </th>
            )}
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-3.5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-xs">
          {rows ? (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                {enableBulkSelection && (
                  <td className="px-6 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onSelectOneToggle && onSelectOneToggle(row.id)}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                )}
                {row.cells.map((cell, idx) => (
                  <td key={idx} className="px-6 py-3.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
