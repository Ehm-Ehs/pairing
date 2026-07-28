import { ReactNode } from "react";

interface ParticipantTableProps {
  headers: ReactNode[];
  children: ReactNode;
  enableBulkSelection?: boolean;
  isAllPageSelected?: boolean;
  onSelectAllToggle?: () => void;
}

export function ParticipantTable({
  headers,
  children,
  enableBulkSelection = false,
  isAllPageSelected = false,
  onSelectAllToggle,
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
          {children}
        </tbody>
      </table>
    </div>
  );
}
