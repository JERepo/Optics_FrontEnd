// components/ui/Table.jsx
import React from "react";
import Pagination from "./Pagination";


export const Table = ({
  columns,
  data,
  renderRow,
  emptyMessage = "No data available",
  className = "",
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  pageSize = 10,
  onPageSizeChange = () => {},
  totalItems = 0,
}) => {
  return (
    <div className="space-y-4">
      <div className={`overflow-x-auto bg-white rounded-lg shadow ${className}`}>
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {data.length > 0 ? (
              data.map((item, rowIndex) => renderRow(item, rowIndex))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalItems={totalItems}
        />
      )}
    </div>
  );
};

// TableRow and TableCell components remain the same
export const TableRow = ({ children, className = "" }) => {
  return (
    <tr className={`hover:bg-neutral-50 transition-colors ${className}`}>
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = "" }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>
  );
};