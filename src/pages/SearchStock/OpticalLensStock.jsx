import React, { useState } from "react";
import Button from "../../components/ui/Button";
import { FiChevronDown } from "react-icons/fi";

import { Table, TableCell, TableRow } from "../../components/Table";

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const OpticalLensStock = () => {
  // State for individual column search terms
  const [columnSearchTerms, setColumnSearchTerms] = useState({
    "s.no": "",
    "brand group": "",
    "brand name": "",
    cat: "",
    type: "",
    "model no": "",
    "colour code": "",
    "size-dbl-length": "",
    barcode: "",
    "frame colour": "",
    others: "",
    mrp: "",
    stock: "",
    "stock avl": "",
    action: "",
  });

  const renderHeader = (column) => (
    <div className="flex flex-col">
      {toTitleCase(column)}
      {column !== "action" &&
        column !== "s.no" &&
        column !== "mrp" &&
        column !== "stock" &&
        (
          <div className="relative mt-1">
            {/* <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" /> */}
            <input
              type="text"
              placeholder={`Search ${toTitleCase(column)}...`}
              className="w-full pl-2 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={columnSearchTerms[column]}
              //   onChange={(e) => handleColumnSearch(column, e.target.value)}
            />
          </div>
        )}
    </div>
  );

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Optical Lens Stock
          </h2>
          <Button variant="outline" className="flex items-center gap-2">
            <FiChevronDown className="transform rotate-90" />
            Back
          </Button>
        </div>

        {/* Table with search inputs in headers */}
        <Table
          expand={true}
          columns={[
            "s.no",
            "brand group",
            "product name",
            "barcode",
            "variation",
            "mrp",
            "stock",
            "action",
          ]}
          data={[]}
          renderHeader={renderHeader}
          renderRow={(item, index) => (
            <TableRow key={item.id}>
              <TableCell>{item.sno}</TableCell>
              <TableCell>{item.brandGroup}</TableCell>
              <TableCell>{item.brandName}</TableCell>
              <TableCell>{item.cat}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.modelNo}</TableCell>
              <TableCell>{item.colourCode}</TableCell>
              <TableCell>{item.sizeDblLength}</TableCell>
              <TableCell>{item.barcode}</TableCell>
              <TableCell>{item.frameColour}</TableCell>
              <TableCell>{item.others}</TableCell>
              <TableCell>{item.mrp}</TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell>{item.stockAvl}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Action
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  );
};

export default OpticalLensStock;
