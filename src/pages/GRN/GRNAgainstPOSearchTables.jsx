import { useState } from "react";
import { Table, TableRow, TableCell } from "../../components/Table";

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
                            {/* <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell> */}
                            <TableCell>{item.Name}
                                {item.Size && <br />}{item.Size ? `Size: ${item.Size}` : ""}
                                {item.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : ""}
                                {item.HSN && <br />}{item.HSN ? `HSN: ${item.HSN}` : ""}
                            </TableCell>
                            <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
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
                    columns={["PO No. (Order No.)", "Product Details", "S/O", "Others", "MRP", "Buying Price", "PO QTY", "Pending Qty", "Action"]}
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
                            <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                            </TableCell>
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
                    columns={["PO No. (Order No.)", "Product Details", "S/O", "Others", "MRP", "Buying Price", "PO QTY"]}
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
                            <TableCell>{item.Name}
                                {item.Size && <br />}{item.Size ? `Size: ${item.Size}` : ""}
                                {item.Barcode && <br />}{item.Barcode ? `Barcode: ${item.Barcode}` : ""}
                                {item.HSN && <br />}{item.HSN ? `HSN: ${item.HSN}` : ""}
                            </TableCell>
                            <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                            </TableCell>
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
                    columns={["PO No. (Order No.)", "Product Details", "S/O", "Others", "MRP", "Buying Price", "PO QTY"]}
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
                            <TableCell>
                                {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                            </TableCell>
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

            {(productType === 2 && GRNAgainstPOorderType === "Auto Processing") && (
                // Accessory -> Auto processing -> Enter barcode 
                poDetailsItem === 2 ? (
                    <Table
                        columns={["PO No. (Order No.)", "Product Details", "Variation", "SKU Code", "MRP", "Buying Price", "PO Qty"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.PONo} <br /> {`(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                                <TableCell>
                                    {item.Name}
                                    {item.Size && <br />}{item.Size}
                                    {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                    {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                </TableCell>
                                <TableCell>{item.Variation}</TableCell>
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
                                    {/* <TableCell>{item.Name}{item.Size && <br />}{item.Size}</TableCell> */}
                                    <TableCell>
                                        {item.Name}
                                        {item.Size && <br />}{item.Size}
                                        {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                        {item.HSN && <br />}{`HSN: ${item.HSN}`}
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
                                    {item.Size && <br />}{item.Size}
                                    {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                    {item.HSN && <br />}{`HSN: ${item.HSN}`}
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
                            columns={["PO No. (Order No.)", "Product Details", "S/O", "Others", "MRP", "Buying Price", "PO QTY", "Pending Qty", "Action"]}
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
                                    <TableCell>
                                        {item.Name}
                                        {item.Size && <br />}{item.Size}
                                        {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                        {item.HSN && <br />}{`HSN: ${item.HSN}`}
                                    </TableCell>
                                    <TableCell>
                                        {item.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                                    </TableCell>
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
                                    {item.Size && <br />}{item.Size}
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

            {productType === 3 && (
                poDetailsItem === 2 ? (
                    <Table
                        columns={["Barcode", "Spherical Power", "Cylindrical Power", "Axis", "Additional", "MRP", "Buying Price", "Action"]}
                        data={searchResults}
                        renderRow={(item, index) => (
                            <TableRow key={item.Barcode || index}>
                                <TableCell>{item.Barcode}</TableCell>
                                <TableCell className="">{item.SphericalPower}</TableCell>
                                <TableCell>{item.CylindricalPower}</TableCell>
                                <TableCell>{item.Axis}</TableCell>
                                <TableCell>{item.Additional}</TableCell>
                                <TableCell>₹{item.MRP}</TableCell>
                                <TableCell>₹{item.BuyingPrice}</TableCell>
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