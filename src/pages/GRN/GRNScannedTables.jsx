


import { Trash2 } from "lucide-react";
import { Table, TableRow, TableCell } from "../../components/Table";

export function GRNScannedTable({ scannedItems, updateScannedItemPrice, updateScannedItemQuantity, removeScannedItem, productType }) {
    return (
        <>
            {productType === 1 && (
                <Table
                    columns={["Barcode", "Name", "S/O", "Polarised", "Photochromatic", "Clip No", "MRP", "Buying Price", "GRN QTY", "Action"]}
                    data={scannedItems}
                    renderRow={(item, index) => (
                        <TableRow key={item.Id || index}>
                            <TableCell>{item.Barcode}</TableCell>
                            <TableCell>{item.BrandName ?? ''} {item.Name}
                                {item.Size && <br />}{`Size: ${item.Size}`}
                            </TableCell>
                            <TableCell>
                                {item.Category === 0 ? 'Optical Frame' : 'Sunglass'}
                            </TableCell>
                            <TableCell className="text-center">{item.PO ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-center">{item.Ph ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-center">{item.Cl}</TableCell>
                            <TableCell>₹{item.MRP}</TableCell>
                            <TableCell>₹{" "}
                                <input
                                    type="number"
                                    value={item.price || 0}
                                    onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded"
                                />
                            </TableCell>
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

            {productType === 2 && (
                <Table
                    columns={["Barcode", "Name", "Variation", "SKU Code", "MRP", "Buying Price", "GRN QTY", "Action"]}
                    data={scannedItems}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            <TableCell>{item.Barcode}</TableCell>
                            <TableCell>{item.BrandName ?? ''} {item.Name}{item.Size && <br />}{item.Size}</TableCell>
                            <TableCell>{item.Variation}</TableCell>
                            <TableCell>{item.SKU}</TableCell>
                            <TableCell>₹{item.MRP}</TableCell>
                            <TableCell>₹{" "}
                                <input
                                    type="number"
                                    value={item.price || 0}
                                    onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded"
                                />
                            </TableCell>
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
            {console.log("scannedItems--------------- dkahdkjah", scannedItems)}
            {productType === 3 && (
                <Table
                    columns={["SL No.", "Order No.", "Supplier Order No.", "Barcode", "Product Name", "MRP", "Buying Price", "GRN QTY", "Action"]}
                    data={scannedItems}
                    renderRow={(item, index) => (
                        <TableRow key={item.Barcode || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{ }</TableCell>
                            <TableCell>{ }</TableCell>
                            <TableCell>{item.Barcode}</TableCell>
                            <TableCell>{item?.BrandName ?? ''} {item?.ProductName}
                                {item.Size && <br />}{item.Size}
                                {item.SphericalPower && <br />}{item.SphericalPower ? `Sph: ${item.SphericalPower > 0 ? `+` : ``}${item.SphericalPower}` : `Sph: `}
                                {item.CylindricalPower ? ` Cyl: ${item.CylindricalPower>0 && `+`}${item.CylindricalPower}` : ` Cyl: `}
                                {item.Axis ? ` Axis: ${item.Axis}` : ` Axis: `}
                                {item.Additional ? ` Add: ${item.Additional}` : ` Add: `}
                                {item?.Barcode && <br />}{item?.Barcode ? `Barcode: ${item?.Barcode}`: ``}
                                {(typeof item?.CLBatchCode) === 'string' && <br/>}{(typeof item?.CLBatchCode) === 'string' ? `BatchCode: ${item.CLBatchCode}` : ``}
                                {(typeof item?.CLBatchCode) === 'string' && (item?.Expiry || item?.CLBatchExpiry) && ` Expiry: ${item.Expiry || item?.CLBatchExpiry}`}
                                {item.HSN && <br />}{item.HSN && `HSN: `+item.HSN}
                            </TableCell>
                            <TableCell>₹{item.MRP || item.MRPMaster || 0}</TableCell>
                            <TableCell>₹{" "}
                                <input
                                    type="number"
                                    value={item.price || item.BuyingPriceMaster}
                                    onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded"
                                />
                            </TableCell>
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
        </>
    )
}