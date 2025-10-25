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
  isLoading = false,
}) => {
  const expandingColumns = [
    "Product Details",
    "Product name",
    "product details",
    "product name",
  ];
  const frameColumns = [
    // "s.no",
    "brand group",
    "brand name",
    // "cat",
    // "type",
    "model no",
    "colour code",
    "size-dbl-length",
    "barcode",
    "frame colour",
    // "others",
    // "mrp",
    // "stock",
    // "stock avl",
    // "action",
  ];
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
                  className={`px-4 py-3 min-h-[3.5rem] text-left text-xs font-medium text-neutral-500 uppercase tracking-wider align-top  ${
                    expand && expandingColumns.includes(column)
                      ? "min-w-[220px] max-w-[300px]"
                      : ""
                  } ${freeze ? "sticky top-0 z-10 bg-blue-50" : ""} ${
                    expand && frameColumns.includes(column)
                      ? "min-w-[150px]"
                      : ""
                  } `} // Applied sticky to <th>
                >
                  {typeof renderHeader === "function"
                    ? renderHeader(column)
                    : column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: pageSize }, (_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <div className="h-3 bg-gray-200 rounded-full"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.length > 0 ? (
              data.map((item, rowIndex) => renderRow(item, rowIndex))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data found
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
      className={`px-4 py-2 text-xs ${
        columnName === "Product Details"
          ? "min-w-[300px] max-w-[300px]"
          : "whitespace-nowrap"
      } ${className}`}
    >
      {children}
    </td>
  );
};
