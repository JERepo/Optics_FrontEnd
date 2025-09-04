import { Table, TableRow, TableCell } from "../../components/Table";
import { Trash2 } from "lucide-react";

export function POFrameScannedTable({ headerItems, scannedItems, updateScannedItemQuantity, updateScannedItemPrice, handleDeleteScannedItem }) {

    return (
        <Table
            columns={headerItems}
            data={scannedItems}
            renderRow={(frame, index) => (
                <TableRow key={index}>
                    <TableCell>{frame.Barcode}</TableCell>
                    <TableCell>{frame.Name}{<br />}{frame.Size}</TableCell>
                    <TableCell>
                        {frame.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                    </TableCell>
                    <TableCell className="text-center">{frame.PO ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-center">{frame.Ph ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-center">{frame.Cl}</TableCell>
                    <TableCell>₹{frame.MRP}</TableCell>
                    <TableCell>₹{" "}
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={scannedItems[index]?.price || frame.BuyingPrice}
                            onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                            className="w-30 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell>
                        <input
                            type="number"
                            min="1"
                            value={scannedItems[index]?.quantity || 1}
                            onChange={(e) => updateScannedItemQuantity(index, e.target.value)}
                            className="w-20 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                        <button
                            className="p-1 text-red-600 hover:text-red-800 "
                            aria-label="Delete item"
                            onClick={() => handleDeleteScannedItem(index)}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </TableCell>
                </TableRow>
            )}
        />
    )
}



export function POLensScannedTable({ headerItems, scannedItems, updateScannedItemQuantity, updateScannedItemPrice, handleDeleteScannedItem }) {

    return (
        <Table
            columns={headerItems}
            data={scannedItems}
            renderRow={(ol, index) => (
                <TableRow key={index}>
                    <TableCell>{ol.Barcode}</TableCell>
                    <TableCell>{ol.Spherical}</TableCell>
                    <TableCell>{ol.Cylinder}</TableCell>
                    <TableCell>₹{" "}
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={scannedItems.find(a => a.Id === ol.Id)?.price || ol.BuyingPrice}
                            onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                            className="w-30 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell>
                        <input
                            type="number"
                            min="1"
                            value={scannedItems.find(a => a.Id === ol.Id)?.quantity || 1}
                            onChange={(e) => updateScannedItemQuantity(index, e.target.value)}
                            className="w-20 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                        <button
                            className="p-1 text-red-600 hover:text-red-800 "
                            aria-label="Delete item"
                            onClick={() => handleDeleteScannedItem(index)}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </TableCell>
                </TableRow>
            )}
        />
    )
}


export function POAccessoriesScannedTable({ headerItems, scannedItems, updateScannedItemQuantity, updateScannedItemPrice, handleDeleteScannedItem }) {

    return (
        <Table
            columns={headerItems}
            data={scannedItems}
            renderRow={(acc, index) => (
                <TableRow key={index}>
                    <TableCell>{acc.Barcode}</TableCell>
                    <TableCell>{acc.Name}</TableCell>
                    <TableCell>{acc.Variation}</TableCell>
                    <TableCell>{acc.SKU}</TableCell>
                    <TableCell>₹{acc.MRP}</TableCell>
                    <TableCell>₹{" "}
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={scannedItems[index]?.price || acc.BuyingPrice}
                            onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                            className="w-30 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell>
                        <input
                            type="number"
                            min="1"
                            value={scannedItems[index]?.quantity || 1}
                            onChange={(e) => updateScannedItemQuantity(index, e.target.value)}
                            className="w-20 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                        <button
                            className="p-1 text-red-600 hover:text-red-800 "
                            aria-label="Delete item"
                            onClick={() => handleDeleteScannedItem(index)}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </TableCell>
                </TableRow>
            )}
        />
    )
}



export function POCLScannedTable({ headerItems, scannedItems, updateScannedItemQuantity, updateScannedItemPrice, handleDeleteScannedItem }) {

    return (
        <Table
            columns={headerItems}
            data={scannedItems}
            renderRow={(cl, index) => (
                <TableRow key={index}>
                    <TableCell>{cl.Barcode}</TableCell>
                    <TableCell>{cl.SphericalPower || cl.sphericalPower}</TableCell>
                    <TableCell>{cl.CylindricalPower}</TableCell>
                    <TableCell>{cl.Axis}</TableCell>
                    <TableCell>{cl.Additional}</TableCell>
                    <TableCell>₹{" "}
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={scannedItems.find(item => item.Id === cl.Id)?.price || cl.BuyingPrice}
                            onChange={(e) => updateScannedItemPrice(index, e.target.value)}
                            className="w-30 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell>
                        <input
                            type="number"
                            min="1"
                            value={scannedItems.find(item => item.Id === cl.Id)?.quantity || 1}
                            onChange={(e) => updateScannedItemQuantity(index, e.target.value)}
                            className="w-20 px-2 py-1 border rounded"
                        />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                        <button
                            className="p-1 text-red-600 hover:text-red-800 "
                            aria-label="Delete item"
                            onClick={() => handleDeleteScannedItem(index)}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </TableCell>
                </TableRow>
            )}
        />
    )
}