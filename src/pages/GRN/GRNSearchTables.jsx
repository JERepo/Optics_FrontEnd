import { Table, TableRow, TableCell } from "../../components/Table";

export function GRNSearchTable({ searchResults, selectedRows, handleCheckboxChange, productType }) {
    return (
        <>
            {productType === 1 && (
                <Table
                    columns={["", "Barcode", "Name", "S/O", "Polarised", "Photochromatic", "Clip No", "MRP", "Buying Price"]}
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
                            <TableCell>{item.Name}
                                {item.Size && <br />}{`Size: ${item.Size}`}
                            </TableCell>
                            <TableCell>
                                {item.Category === 0 ? 'Optical Frame' : 'Sunglass'}
                            </TableCell>
                            <TableCell className="text-center">{item.PO ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-center">{item.Ph ? "Yes" : "No"}</TableCell>
                            <TableCell className="text-center">{item.Cl}</TableCell>
                            <TableCell>₹{item.MRP}</TableCell>
                            <TableCell>₹{item.BuyingPrice}</TableCell>
                        </TableRow>
                    )}
                />
            )}

            {productType === 2 && (
                <Table
                    columns={["", "Barcode", "Name", "Variation", "SKU Code", "MRP", "Buying Price"]}
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
            )}

            {productType === 3 && (
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