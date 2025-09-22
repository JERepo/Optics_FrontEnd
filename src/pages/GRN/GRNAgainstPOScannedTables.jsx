


import { Trash2 } from "lucide-react";
import { Table, TableRow, TableCell } from "../../components/Table";
import { useState } from "react";

export function GRNAgainstPOScannedTable({ scannedItems, updateScannedItemPrice, updateScannedItemQuantity, removeScannedItem, productType }) {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [newQuantity, setNewQuantity] = useState('');

    const openModal = (index, currentQuantity) => {
        setEditingIndex(index);
        setNewQuantity(currentQuantity);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingIndex(null);
        setNewQuantity('');
    };

    const handleQuantityUpdate = async () => {
        if (editingIndex !== null) {
            await updateScannedItemQuantity(editingIndex, newQuantity, batchCode);
            closeModal();
        }
    };

    return (
        <>
            {/* FRAME FINAL GRN DATA*/}
            {productType === 1 && (
                <>
                    <Table
                        columns={["PO No. (Order No.)", "Product Details", "Others", "MRP", "Buying Price", "PO QTY", "Pending Qty", "GRN Qty", "Action"]}
                        data={scannedItems}
                        renderRow={(item, index) => (
                            <TableRow key={index}>
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
                                <TableCell className="">₹ {item.MRP}</TableCell>
                                <TableCell>₹{" "}
                                    <input
                                        type="number"
                                        value={item.price || 0}
                                        onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                                        className="w-20 px-2 py-1 border rounded"
                                    />
                                </TableCell>
                                <TableCell className=" ">{item.POQty}</TableCell>
                                <TableCell>{item.POQty - (item.quantity ?? 0) - item.CancelledQty - (item.ReceivedQty ?? 0)}</TableCell>
                                {/* <TableCell>
                                    <button
                                        onClick={() => openModal(index, item.quantity || 1)}
                                        className="w-16 px-2 py-1 border rounded bg-white hover:bg-gray-50 cursor-pointer text-left"
                                    >
                                        {item.quantity || 1}
                                    </button>
                                </TableCell> */}
                                <TableCell>
                                    <input
                                        type="number"
                                        value={item.quantity || 1}
                                        onChange={(e) => updateScannedItemQuantity(index, e.target.value)}
                                        className="w-16 px-2 py-1 border rounded"
                                        min="1"
                                    />
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => removeScannedItem(index)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                        aria-label="Delete item"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        )}
                    />

                    {/* Quantity Edit Modal */}
                    {isModalOpen && editingIndex !== null && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-96">
                                <h3 className="text-lg font-semibold mb-4">Edit GRN Quantity</h3>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Product: {scannedItems[editingIndex]?.Name}
                                    </label>
                                    <label className="block text-sm font-medium mb-2">
                                        PO No: {scannedItems[editingIndex]?.PONo}
                                    </label>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        Available Pending Qty: {scannedItems[editingIndex].POQty - (scannedItems[editingIndex].ReceivedQty ?? 0) - scannedItems[editingIndex].CancelledQty}
                                    </label>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">GRN Quantity</label>
                                    <input
                                        type="number"
                                        value={newQuantity}
                                        onChange={(e) => setNewQuantity(e.target.value)}
                                        min="1"
                                        max={scannedItems[editingIndex].POQty - (scannedItems[editingIndex].ReceivedQty ?? 0) - scannedItems[editingIndex].CancelledQty}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleQuantityUpdate}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ACCESSORY FINAL GRN DATA */}
            {productType === 2 && (
                <Table
                    columns={["PO No. (Order No.)", "Product Details", "SKU Code", "MRP", "Buying Price", "PO QTY", "Pending Qty", "GRN Qty", "Action"]}
                    data={scannedItems}
                    renderRow={(item, index) => (
                        <TableRow key={item.Id || index}>
                            <TableCell>{item.PONo} <br /> {(item.OrderNo && item.OrderDetailSlNo) && `(${item.OrderNo}${item.OrderDetailSlNo ? `/${item.OrderDetailSlNo}` : ""})`}</TableCell>
                            <TableCell>
                                {item.Name}
                                {item.Variation && <br />}{`Variation: ${item.Variation}`}
                                {item.Barcode && <br />}{`Barcode: ${item.Barcode}`}
                                {item.HSN && <br />}{`HSN: ${item.HSN}`}
                            </TableCell>
                            {/* <TableCell>{item.Variation}</TableCell> */}
                            <TableCell>{item.SKU}</TableCell>
                            <TableCell>₹ {item.MRP}</TableCell>
                            <TableCell>₹{" "}
                                <input
                                    type="number"
                                    value={item.price || item.BuyingPrice || 0}
                                    onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded"
                                />
                            </TableCell>
                            <TableCell className=" ">{item.POQty}</TableCell>
                            {/* <TableCell>{item.POQty - (item.quantity || 1) - item.CancelledQty}</TableCell> */}
                            <TableCell>{item.POQty - (item.quantity ?? 0) - item.CancelledQty - (item.ReceivedQty ?? 0)}</TableCell>

                            <TableCell>
                                <input
                                    type="number"
                                    value={item.quantity || 1}
                                    onChange={(e) => updateScannedItemQuantity(index, e.target.value)}
                                    className="w-16 px-2 py-1 border rounded"
                                    min="1"
                                />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => removeScannedItem(index)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    aria-label="Delete item"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </TableCell>
                        </TableRow>
                    )}
                />
            )}

            {/* {console.log("jahdbakjhbd", scannedItems)} */}
            {productType === 3 && (
                <Table
                    columns={["PO No. (Order No.)", "Product Details", "MRP", "Buying Price", "Order Qty", "PO Qty", "Pending Qty", "GRN Qty", "Action"]}
                    data={scannedItems}
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
                                {item?.BatchCode && <br />}{item.BatchCode ? `BatchCode: ${item.BatchCode} - ${item.Expiry ? `Expiry: ${item.Expiry}` : ``}` : null}
                                {/* {item?.Expiry && <br />}{item.Expiry ? `Expiry: ${item.Expiry}` : null} */}
                                {item.HSN && <br />}{`HSN: ${item.HSN}`}
                            </TableCell>
                            {/* <TableCell>{item.Expiry || 0}</TableCell> */}
                            <TableCell>₹{item.MRP || item.MRPMaster || 0}</TableCell>
                            <TableCell>₹{" "}
                                <input
                                    type="number"
                                    value={item.price || item.BuyingPriceMaster}
                                    onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded"
                                />
                            </TableCell>
                            <TableCell>{item.OrderQty || 0}</TableCell>
                            <TableCell>{item.POQty || 0}</TableCell>
                            {/* <TableCell>{item.POQty - (item.quantity || 1) - item.CancelledQty}</TableCell> */}
                            <TableCell>{item.POQty - (item.quantity ?? 0) - item.CancelledQty - (item.ReceivedQty ?? 0)}</TableCell>

                            <TableCell>
                                <input
                                    type="number"
                                    value={item.quantity || 1}
                                    onChange={(e) => updateScannedItemQuantity(index, e.target.value, item.BatchCode)}
                                    className="w-16 px-2 py-1 border rounded"
                                    min="1"
                                />
                            </TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => removeScannedItem(index)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    aria-label="Delete item"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </TableCell>
                        </TableRow>
                    )}
                />
            )}
        </>
    )
}