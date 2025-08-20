import React from "react";
import Pagination from "./Pagination";

export const Table = ({
  columns,
  data,
  renderRow,
  renderHeader,
  emptyMessage = "No data available",
  className = "",
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  pageSize = 10,
  onPageSizeChange = () => {},
  totalItems = 0,
  freeze = false,
  expand = false,
  name,
}) => {
  return (
    <div className="space-y-4">
      <div
        className={`overflow-auto bg-white rounded-lg shadow max-h-[700px] ${className}`} // Added overflow-auto and max-h-[500px]
      >
        <table className="min-w-full divide-y divide-neutral-200 table-fixed">
          <thead className="bg-blue-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-3 min-h-[3.5rem] text-left text-xs font-medium text-neutral-500 uppercase tracking-wider align-top  ${
                    expand && column === name
                      ? "min-w-[300px] max-w-[300px]"
                      : ""
                  } ${freeze ? "sticky top-0 z-10 bg-neutral-50" : ""}`} // Applied sticky to <th>
                >
                  {typeof renderHeader === "function"
                    ? renderHeader(column)
                    : column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-neutral-200">
            {data?.length > 0 ? (
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

export const TableRow = ({ children, className = "" }) => {
  return (
    <tr className={`hover:bg-neutral-50 transition-colors ${className}`}>
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = "", columnName }) => {
  return (
    <td
      className={`px-6 py-4 ${
        columnName === "Product Details"
          ? "min-w-[300px] max-w-[300px]"
          : "whitespace-nowrap"
      } ${className}`}
    >
      {children}
    </td>
  );
};
