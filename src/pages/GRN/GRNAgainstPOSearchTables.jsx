import { useState } from "react";
import { Table, TableRow, TableCell } from "../../components/Table";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField } from "@mui/material";

export function GRNAgainstPOSearchTable({ searchResults, selectedRows, handleGetPOdetailsByDetailId, handleAddPOdetailstoScannedTable, handleCheckboxChange, productType, poDetailsItem, isAddingItem, GRNAgainstPOorderType }) {
    console.log('TEST see searchResults', searchResults)
    // const [setIsAddingItem, isAddingItem] = useState(false);
    return (
        <>
            {(productType === 1 && poDetailsItem === 1) && (
                <Table
                    columns={["Barcode", "Name", "S/O", "Polarised", "Photochromatic", "Clip No", "MRP", "Buying Price", "Action"]}
                    data={searchResults}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            <TableCell>{item.Barcode}</TableCell>
                            <TableCell>{item.Name}
                                {item.Size && <br />}{item.Size ? `Size: ${item.Size}` : ""}
                                {/* {(item.Category !== null || item.Category !== undefined) && <br />}{item.Category === 0 ? 'CaSunglass' : 'Optical Frame'}
                                {item.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : ""}
                                {item.HSN && <br />}{item.HSN ? `HSN: ${item.HSN}` : ""} */}
                            </TableCell>
                            <TableCell>
                                {item.Category === 0 ? 'Optical Frame' : 'Sunglass'}
                            </TableCell>
                            <TableCell className="text-center">{item.PO ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-center">{item.Ph ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-center">{item.Cl}</TableCell>
                            <TableCell>₹ {item.MRP}</TableCell>
                            <TableCell>₹ {item.BuyingPrice}</TableCell>
                            <TableCell>
                                <button
                                    onClick={() => handleGetPOdetailsByDetailId(item.Id)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Select
                                </button>
                            </TableCell>
                        </TableRow>
                    )}
                />
            )}

            {(productType === 1 && poDetailsItem === 2 && GRNAgainstPOorderType === "Specific Order") && (
                <Table
                    columns={["PO No. (Order No.)", "Product Details", "Others", "MRP", "Buying Price", "PO QTY", "Pending Qty", "Action"]}
                    data={searchResults}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                            <TableCell>{item.Name}
                                {item.Size && <br />}{item.Size ? `Size: ${item.Size}` : ""}
                                {(item.Category !== null || item.Category !== undefined) && <br />}{item.Category === 0 ? 'Category: Optical Frame' : 'Category: Sunglass'}
                                {item.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : ""}
                                {item.HSN && <br />}{item.HSN ? `HSN: ${item.HSN}` : ""}
                            </TableCell>
                            {/* <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                            </TableCell> */}
                            <TableCell className="text-left">
                                <div className="flex gap-2">
                                    <div>{item.IsRxable ? "Rx" : ""}</div>
                                    <div>{item.Ph ? "PH" : ""}</div>
                                    <div>{item.PO ? "PO" : ""}</div>
                                    <div>{item.Cl ? `CL-${item.Cl}` : ""}</div>
                                </div>
                            </TableCell>
                            {/* <TableCell className="text-center grid grid-cols-2">{item.IsRxable ? "Rx" : ""}<br />{item.Ph ? "PH" : ""}<br />{item.PO ? "PO" : ""}<br />{`CL - ${item.Cl || ""}`}</TableCell> */}
                            <TableCell className="">₹ {item.MRP}</TableCell>
                            <TableCell>₹{item.price || 0}</TableCell>
                            <TableCell className=" ">{item.POQty}</TableCell>
                            <TableCell>{item.POQty - (item.ReceivedQty ?? 0) - item.CancelledQty}</TableCell>
                            <TableCell>
                                <button
                                    onClick={() => handleAddPOdetailstoScannedTable(item)}
                                    disabled={isAddingItem}
                                    className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isAddingItem ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                >
                                    {isAddingItem ? 'Adding...' : 'Select'}
                                </button>
                            </TableCell>
                        </TableRow>
                    )}
                />
            )}

            {(productType === 1 && poDetailsItem === 2 && GRNAgainstPOorderType === "Auto Processing") && (
                <Table
                    columns={["PO No. (Order No.)", "Product Details", "Others", "MRP", "Buying Price", "PO QTY"]}
                    data={searchResults}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                            <TableCell>{item.Name}
                                {item.Size && <br />}{item.Size ? `Size: ${item.Size}` : ""}
                                {(item.Category !== null || item.Category !== undefined) && <br />}{item.Category === 0 ? 'Category: Optical Frame' : 'Category: Sunglass'}
                                {item.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : ""}
                                {item.HSN && <br />}{item.HSN ? `HSN: ${item.HSN}` : ""}
                            </TableCell>
                            {/* <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                            </TableCell> */}
                            <TableCell className="text-left">
                                <div className="flex gap-2">
                                    <div>{item.IsRxable ? "Rx" : ""}</div>
                                    <div>{item.Ph ? "PH" : ""}</div>
                                    <div>{item.PO ? "PO" : ""}</div>
                                    <div>{item.Cl ? `CL-${item.Cl}` : ""}</div>
                                </div>
                            </TableCell>
                            {/* <TableCell className="text-center flex">{item.IsRxable ? "Rx" : ""}<br />{item.Ph ? "PH" : ""}<br />{item.PO ? "PO" : ""}<br />{`CL - ${item.Cl || ""}`}</TableCell> */}
                            <TableCell className="">₹ {item.MRP}</TableCell>
                            <TableCell>₹{item.price || 0}</TableCell>
                            <TableCell className=" ">{item.POQty}</TableCell>
                            {/* <TableCell>{item.POQty - (item.ReceivedQty ?? 0) - item.CancelledQty}</TableCell> */}
                        </TableRow>
                    )}
                />
            )}

            {(productType === 1 && poDetailsItem === 3) && (
                <Table
                    columns={["PO No. (Order No.)", "Product Details", "Others", "MRP", "Buying Price", "PO QTY"]}
                    data={searchResults}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            {/* <TableCell>
                                <input
                                    type="checkbox"
                                    checked={selectedRows.some(
                                        (selectedItem) => selectedItem.uniqueId === item.uniqueId
                                    )}
                                    onChange={() => handleCheckboxChange(item)}
                                />
                            </TableCell> */}
                            <TableCell>{item.PONo} <br /> {`(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                            {/* <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell> */}
                            <TableCell>{item.Name}
                                {item.Size && <br />}{item.Size ? `Size: ${item.Size}` : ""}
                                {item.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : ""}
                                {item.HSN && <br />}{item.HSN ? `HSN: ${item.HSN}` : ""}
                            </TableCell>
                            {/* <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                            </TableCell> */}
                            <TableCell className="text-left">
                                <div className="flex gap-2">
                                    <div>{item.IsRxable ? "Rx" : ""}</div>
                                    <div>{item.Ph ? "PH" : ""}</div>
                                    <div>{item.PO ? "PO" : ""}</div>
                                    <div>{item.Cl ? `CL-${item.Cl}` : ""}</div>
                                </div>
                            </TableCell>
                            {/* <TableCell className="text-center flex">{item.IsRxable ? "Rx" : ""}<br />{item.Ph ? "PH" : ""}<br />{item.PO ? "PO" : ""}<br />{`CL - ${item.Cl || ""}`}</TableCell> */}
                            <TableCell className="">₹ {item.MRP}</TableCell>
                            <TableCell>₹{item.price || 0}</TableCell>
                            <TableCell className=" ">{item.POQty}</TableCell>
                            {/* <TableCell>{item.POQty - (item.ReceivedQty ?? 0) - item.CancelledQty}</TableCell> */}
                        </TableRow>
                    )}
                />
            )}



            {/* Accessory --------------------------------------------------------------------------------------------------------------------*/}
            {(productType === 2 && GRNAgainstPOorderType === "Auto Processing") && (
                // Accessory -> Auto processing -> Enter barcode 
                poDetailsItem === 2 ? (
                    <Table
                        columns={["PO No. (Order No.)", "Product Details", "SKU Code", "MRP", "Buying Price", "PO Qty"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                                <TableCell>
                                    {item.Name}
                                    {item.Variation && <br />}{`Variation: ${item.Variation}`}
                                    {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                    {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                </TableCell>
                                {/* <TableCell>{item.Variation}</TableCell> */}
                                <TableCell>{item.SKU}</TableCell>
                                <TableCell>₹{item.MRP}</TableCell>
                                <TableCell>₹{item.BuyingPrice}</TableCell>
                                <TableCell className=" ">{item.POQty}</TableCell>
                            </TableRow>
                        )}
                    />
                ) :

                    // Accessory -> Auto processing -> Enter Product search -> Select detail table
                    poDetailsItem === 1 ? (
                        <Table
                            columns={["Barcode", "Name", "Variation", "SKU Code", "MRP", "Buying Price", "Action"]}
                            data={searchResults}
                            renderRow={(item, index) => (
                                <TableRow key={index}>

                                    <TableCell>{item.Barcode}</TableCell>
                                    <TableCell>
                                        {item.Name}
                                        {/* {item.Variation && <br />}{`Variation: ${item.Variation}`} */}
                                        {/* {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                        {item.HSN && <br />}{`HSN: ${item.HSN}`} */}
                                    </TableCell>
                                    <TableCell>{item.Variation}</TableCell>
                                    <TableCell>{item.SKU}</TableCell>
                                    <TableCell>₹{item.MRP}</TableCell>
                                    <TableCell>₹{item.BuyingPrice}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleGetPOdetailsByDetailId(item.Id)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                            Select
                                        </button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    ) : null
            )}

            {(productType === 2 && GRNAgainstPOorderType === "Specific Order") && (
                // Accessory -> Specific Order -> Product Search -> barcode entry table
                poDetailsItem === 1 ? (
                    <Table
                        columns={["Barcode", "Name", "Variation", "SKU Code", "MRP", "Buying Price", "Action"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={index}>

                                <TableCell>{item.Barcode}</TableCell>
                                {/* <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell> */}
                                <TableCell>
                                    {item.Name}
                                </TableCell>
                                <TableCell>{item.Variation}</TableCell>
                                <TableCell>{item.SKU}</TableCell>
                                <TableCell>₹{item.MRP}</TableCell>
                                <TableCell>₹{item.BuyingPrice}</TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => handleGetPOdetailsByDetailId(item.Id)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Select
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                ) :
                    // Accessory -> Specific Order -> barcode
                    poDetailsItem === 2 ? (
                        <Table
                            columns={["PO No. (Order No.)", "Product Details", "SKU Code", "MRP", "Buying Price", "PO QTY", "Pending Qty", "Action"]}
                            data={searchResults}
                            renderRow={(item, index) => (
                                <TableRow key={item.Barcode || index}>
                                    <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                                    <TableCell>
                                        {item.Name}
                                        {item.Variation && <br />}{`Variation: ${item.Variation}`}
                                        {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                        {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                    </TableCell>
                                    {/* <TableCell>
                                        {item.Variation}
                                    </TableCell> */}
                                    <TableCell>{item.SKU}</TableCell>
                                    <TableCell className="">₹ {item.MRP}</TableCell>
                                    <TableCell>₹{item.price || 0}</TableCell>
                                    <TableCell className=" ">{item.POQty}</TableCell>
                                    <TableCell>{item.POQty - (item.ReceivedQty ?? 0) - item.CancelledQty}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleAddPOdetailstoScannedTable(item)}
                                            disabled={isAddingItem}
                                            className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isAddingItem ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                                                }`}
                                        >
                                            {isAddingItem ? 'Adding...' : 'Select'}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    ) : null

            )}

            {productType === 2 && (
                // Accessory -> 
                (GRNAgainstPOorderType === "Auto Processing" && poDetailsItem === 4) && (
                    <Table
                        columns={["", "Barcode", "Name", "Variation", "SKU Code", "MRP", "Buying Price"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.some(
                                            (selectedItem) => selectedItem.uniqueId === item.uniqueId
                                        )}
                                        onChange={() => handleCheckboxChange(item)}
                                    />
                                </TableCell>
                                <TableCell>{item.Barcode}</TableCell>
                                {/* <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell> */}
                                <TableCell>
                                    {item.Name}
                                    {item.Variation && <br />}{`Variation: ${item.Variation}`}
                                    {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                    {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                </TableCell>
                                <TableCell>{item.Variation}</TableCell>
                                <TableCell>{item.SKU}</TableCell>
                                <TableCell>₹{item.MRP}</TableCell>
                                <TableCell>₹{item.BuyingPrice}</TableCell>
                            </TableRow>
                        )}
                    />
                )
            )}

            {(productType === 3 && GRNAgainstPOorderType === "Specific Order") && (
                // CL -> Specific Order -> Barcode && product search
                poDetailsItem === 2 ? (
                    <Table
                        columns={["PO No. (Order No.)", "Product Details", "MRP", "Buying Price", "PO Qty", "Action"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={item.index}>
                                {/* <TableCell>{item.Barcode}</TableCell> */}
                                <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                                {/* <TableCell>{item.PONo} <br /> {`(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell> */}
                                <TableCell>
                                    {item.Name}
                                    {item.SphericalPower && <br />}{item.SphericalPower ? `Sph: ${item.SphericalPower > 0 ? `+` : `-`}${item.SphericalPower}` : `Sph: `}
                                    {item.CylindricalPower ? ` Cyl: ${item.CylindricalPower > 0 ? `+` : `-`}${item.CylindricalPower}` : ` Cyl: `}
                                    {item.Axis ? ` Axis: ${item.Axis > 0 ? `+` : `-`}${item.Axis}` : ` Axis: `}
                                    {item.Additional ? ` Add: ${item.Additional > 0 ? `+` : `-`}${item.Additional}` : ` Add: `}
                                    {item.Size && <br />}{item.Size}
                                    {item?.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : null}
                                    {item?.BatchCode && <br />}{item.BatchCode ? `BatchCode: ${item.BatchCode}` : null}
                                    {item?.Expiry && <br />}{item.Expiry ? `Expiry: ${item.Expiry}` : null}
                                    {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                </TableCell>
                                <TableCell>₹{item.MRP}</TableCell>
                                <TableCell>₹{item.BuyingPrice}</TableCell>
                                <TableCell>{item.POQty || 0}</TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => handleAddPOdetailstoScannedTable(item)}
                                        disabled={isAddingItem}
                                        className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isAddingItem ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                                            }`}
                                    >
                                        {isAddingItem ? 'Adding...' : 'Select'}
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                ) :
                    // CL -> Specific Order -> Product Search -> Power Search (Barcode table)
                    poDetailsItem === 1 ? (
                        <Table
                            columns={["Barcode", "Spherical power", "Cylindrical power", "Axis", "Additional", "MRP", "Buying Price", "Action"]}
                            data={searchResults}
                            renderRow={(item, index) => (
                                <TableRow key={item.index}>
                                    <TableCell>{item.Barcode}</TableCell>
                                    <TableCell>{item.SphericalPower}</TableCell>
                                    <TableCell>{item.CylindricalPower}</TableCell>
                                    <TableCell>{item.Axis}</TableCell>
                                    <TableCell>{item.Additional}</TableCell>
                                    <TableCell>₹{item.MRPMaster}</TableCell>
                                    <TableCell>₹{item.BuyingPriceMaster}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleGetPOdetailsByDetailId(item.CLDetailId)}
                                            disabled={isAddingItem}
                                            className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isAddingItem ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                                                }`}
                                        >
                                            {isAddingItem ? 'Adding...' : 'Select'}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    ) : (
                        <Table
                            columns={["Product Name + Brand Name", "Product Type", "MRP", "Selling Price", "Buying Price", "Spherical Power", "Cylindrical Power", "Axis", "Additional", "Colour"]}
                            data={searchResults}
                            renderRow={(item, index) => (
                                <TableRow key={item.Barcode || index}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.some(
                                                (selectedItem) => selectedItem.Barcode === item.Barcode
                                            )}
                                            onChange={() => handleCheckboxChange(item)}
                                        />
                                    </TableCell>
                                    <TableCell>{item.Barcode}</TableCell>
                                    <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell>
                                    <TableCell>{item.Variation}</TableCell>
                                    <TableCell>{item.SKU}</TableCell>
                                    <TableCell>₹{item.MRP}</TableCell>
                                    <TableCell>₹{item.BuyingPrice}</TableCell>
                                </TableRow>
                            )}
                        />
                    )
            )}

            {(productType === 3 && GRNAgainstPOorderType === "Auto Processing") && (
                // CL -> Specific Order -> Barcode && product search
                poDetailsItem === 2 ? (
                    <Table
                        columns={["PO No. (Order No.)", "Product Details", "MRP", "Buying Price", "PO Qty"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={item.index}>
                                <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                                <TableCell>
                                    {item.Name}
                                    {item.SphericalPower && <br />}{item.SphericalPower ? `Sph: ${item.SphericalPower > 0 ? `+` : `-`}${item.SphericalPower}` : `Sph: `}
                                    {item.CylindricalPower ? ` Cyl: ${item.CylindricalPower > 0 ? `+` : `-`}${item.CylindricalPower}` : ` Cyl: `}
                                    {item.Axis ? ` Axis: ${item.Axis > 0 ? `+` : `-`}${item.Axis}` : ` Axis: `}
                                    {item.Additional ? ` Add: ${item.Additional > 0 ? `+` : `-`}${item.Additional}` : ` Add: `}
                                    {item.Size && <br />}{item.Size}
                                    {item?.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : null}
                                    {item?.BatchCode && <br />}{item.BatchCode ? `BatchCode: ${item.BatchCode}` : null}
                                    {item?.Expiry && <br />}{item.Expiry ? `Expiry: ${item.Expiry}` : null}
                                    {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                </TableCell>
                                <TableCell>₹{item.MRP}</TableCell>
                                <TableCell>₹{item.BuyingPrice}</TableCell>
                                <TableCell>{item.POQty || 0}</TableCell>
                            </TableRow>
                        )}
                    />
                ) :
                    // CL -> Specific Order -> Product Search -> Power Search (Barcode table)
                    poDetailsItem === 1 ? (
                        <Table
                            columns={["Barcode", "Spherical power", "Cylindrical power", "Axis", "Additional", "MRP", "Buying Price", "Action"]}
                            data={searchResults}
                            renderRow={(item, index) => (
                                <TableRow key={item.index}>
                                    <TableCell>{item.Barcode}</TableCell>
                                    <TableCell>{item.SphericalPower}</TableCell>
                                    <TableCell>{item.CylindricalPower}</TableCell>
                                    <TableCell>{item.Axis}</TableCell>
                                    <TableCell>{item.Additional}</TableCell>
                                    <TableCell>₹{item.MRPMaster}</TableCell>
                                    <TableCell>₹{item.BuyingPriceMaster}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleGetPOdetailsByDetailId(item.CLDetailId)}
                                            disabled={isAddingItem}
                                            className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isAddingItem ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                                                }`}
                                        >
                                            {isAddingItem ? 'Adding...' : 'Select'}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    ) : (
                        <Table
                            columns={["Product Name + Brand Name", "Product Type", "MRP", "Selling Price", "Buying Price", "Spherical Power", "Cylindrical Power", "Axis", "Additional", "Colour"]}
                            data={searchResults}
                            renderRow={(item, index) => (
                                <TableRow key={item.Barcode || index}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.some(
                                                (selectedItem) => selectedItem.Barcode === item.Barcode
                                            )}
                                            onChange={() => handleCheckboxChange(item)}
                                        />
                                    </TableCell>
                                    <TableCell>{item.Barcode}</TableCell>
                                    <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell>
                                    <TableCell>{item.Variation}</TableCell>
                                    <TableCell>{item.SKU}</TableCell>
                                    <TableCell>₹{item.MRP}</TableCell>
                                    <TableCell>₹{item.BuyingPrice}</TableCell>
                                </TableRow>
                            )}
                        />
                    )
            )}
        </>
    )
}


export function GRNCLSearchTable({ clSearchItems }) {
    return (
        <>
            <Table
                columns={["Product Name + Brand Name", "Product Type", "MRP", "Selling Price", "Buying Price", "S/O", "Polarised", "Photochromatic", "Clip No", "MRP", "Buying Price"]}
                data={clSearchItems}
                renderRow={(item, index) => (
                    <TableRow key={item.Barcode || index}>
                        <TableCell>{item.ProductName || ''} {item.BrandName}</TableCell>
                        <TableCell>{item.Barcode}</TableCell>
                        <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell>
                        <TableCell>
                            {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                        </TableCell>
                        <TableCell className="text-center">{item.PO ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-center">{item.Ph ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-center">{item.Cl}</TableCell>
                        <TableCell>₹{item.MRP}</TableCell>
                        <TableCell>₹{item.BuyingPrice}</TableCell>
                    </TableRow>
                )}
            />
        </>
    )
}



export function BatchSelectionModal({ open, onClose, batches, onBatchSelect, item }) {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchCodeInput, setBatchCodeInput] = useState("");
    const [batchInputType, setBatchInputType] = useState("select");

    const handleBatchConfirm = () => {
        if (batchInputType === "select" && !selectedBatch) {
            toast.error("Please select a batch code");
            return;
        }
        if (batchInputType === "enter" && !batchCodeInput) {
            toast.error("Please enter a batch code");
            return;
        }

        const batch = batchInputType === "select" ? selectedBatch : batches?.find(
            (b) => b.CLBatchCode.toLowerCase() === batchCodeInput.toLowerCase()
        );

        if (!batch && batchInputType === "enter") {
            toast.error("Invalid batch code");
            return;
        }

        onBatchSelect(batch, item);
        onClose();
        setSelectedBatch(null);
        setBatchCodeInput("");
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Select Batch Code for Contact Lens</DialogTitle>
            <DialogContent>
                <div className="flex space-x-4 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="batchInputType"
                            value="select"
                            checked={batchInputType === "select"}
                            onChange={() => setBatchInputType("select")}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">Select Batch Code</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="batchInputType"
                            value="enter"
                            checked={batchInputType === "enter"}
                            onChange={() => setBatchInputType("enter")}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">Enter Batch Barcode</span>
                    </label>
                </div>

                {batchInputType === "select" ? (
                    <Autocomplete
                        options={batches || []}
                        getOptionLabel={(option) => option.CLBatchCode || ""}
                        value={selectedBatch}
                        onChange={(_, newValue) => setSelectedBatch(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Batch Code" variant="outlined" fullWidth />
                        )}
                        isOptionEqualToValue={(option, value) => option.CLBatchCode === value.CLBatchCode}
                    />
                ) : (
                    <TextField
                        label="Enter Batch Code"
                        value={batchCodeInput}
                        onChange={(e) => setBatchCodeInput(e.target.value)}
                        fullWidth
                        variant="outlined"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleBatchConfirm();
                        }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleBatchConfirm} color="primary" disabled={batchInputType === "select" && !selectedBatch}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
} 