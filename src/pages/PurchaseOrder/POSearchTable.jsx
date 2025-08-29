import { Table, TableRow, TableCell } from "../../components/Table";
import { HardDriveDownload, RefreshCcw, SearchIcon, Trash2 } from "lucide-react";
import Input from "../../components/Form/Input";
import Button from "../../components/ui/Button";


export function POFrameSearchTable({ headerItems, searchResults, selectedRows, handleCheckboxChange }) {

    return (
        <Table
            columns={headerItems}
            data={searchResults}
            renderRow={(frame, index) => (
                <TableRow key={frame.barcode}>
                    <TableCell>
                        <input
                            type="checkbox"
                            checked={selectedRows.some(
                                (i) => i.Barcode === frame.Barcode
                            )}
                            onChange={() => handleCheckboxChange(frame)}
                        />
                    </TableCell>
                    <TableCell>{frame.Barcode}</TableCell>
                    <TableCell>{frame.Name}{<br />}{frame.Size}</TableCell>
                    <TableCell>
                        {frame.Category === 0 ? 'Sunglass' : 'Optical Frame'}
                    </TableCell>
                    <TableCell className="text-center">{frame.PO ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-center">{frame.Ph ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-center">{frame.Cl}</TableCell>
                    <TableCell>₹{frame.MRP}</TableCell>
                    <TableCell>{frame.BuyingPrice}</TableCell>
                </TableRow>
            )}
        />
    )
}


export function POCLpowerSearchTable({ headerItems, newItem, handlePowerSearchInputChange, handleSearch, handleRefresh, isPowerDetailsLoading, errors, searchFethed }) {

    return (
        <Table
            columns={headerItems}
            data={[{}]}
            renderRow={() => (
                <TableRow key="input-row">
                    <TableCell>
                        <Input
                            name="sphericalPower"
                            value={newItem.sphericalPower ?? ""}
                            onChange={handlePowerSearchInputChange}
                            error={errors.sphericalPower}
                            grayOut={searchFethed}
                        />
                    </TableCell>
                    <TableCell>
                        <Input
                            name="cylindricalPower"
                            value={newItem.cylindricalPower ?? ""}
                            onChange={handlePowerSearchInputChange}
                            error={errors.cylindricalPower}
                            grayOut={searchFethed}
                        />
                    </TableCell>
                    <TableCell>
                        <Input
                            name="axis"
                            value={newItem.axis ?? ""}
                            onChange={handlePowerSearchInputChange}
                            error={errors.axis}
                            grayOut={searchFethed}
                        />
                    </TableCell>
                    <TableCell>
                        <Input
                            name="additional"
                            value={newItem.additional ?? ""}
                            onChange={handlePowerSearchInputChange}
                            error={errors.additional}
                            grayOut={searchFethed}
                        />
                    </TableCell>
                    <TableCell className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleSearch}
                            disabled={isPowerDetailsLoading}
                            variant="outline"
                        >
                            {isPowerDetailsLoading ? "Searching..." : <SearchIcon />}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isPowerDetailsLoading}
                            variant="outline"
                        >
                            {isPowerDetailsLoading ? "Refreshing..." : <RefreshCcw />}
                        </Button>
                    </TableCell>
                </TableRow>
            )}
        />
    )
}




export function POolSearchTable({
    newItem, 
    handlePowerSearchInputChange, 
    errors, 
    searchFethed, 
    setNewItem, 
    olPowerDia,
    handleSearchDia,
    isGetDiameterLoading,
    handleOlSearch,
    isPowerDetailsLoading,
    handleRefresh
}) {
    return (
        <Table
            columns={["Spherical Power", "Cylindrical Power", "Diameter", "Action"]}
            data={[{}]}
            renderRow={() => (
                <TableRow key="input-row items-center">
                    <TableCell>
                        <Input
                            name="sphericalPower"
                            value={newItem.sphericalPower ?? ""}
                            onChange={handlePowerSearchInputChange}
                            error={errors.sphericalPower}
                            grayOut={searchFethed}
                        />
                    </TableCell>
                    <TableCell>
                        <Input
                            name="cylindricalPower"
                            value={newItem.cylindricalPower ?? ""}
                            onChange={handlePowerSearchInputChange}
                            error={errors.cylindricalPower}
                            grayOut={searchFethed}
                        />
                    </TableCell>
                    <TableCell className="">
                        {(olPowerDia.length > 0) ? (
                            <select
                                value={newItem.diameter}
                                onChange={(e) => setNewItem((prev) => ({ ...prev, diameter: e.target.value }))}
                                className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a Diameter</option>
                                {olPowerDia.map((dia) => (
                                    <option key={dia.Id} value={dia.Id}>
                                        {dia.DiameterSize}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Button
                                    size="sm"
                                    onClick={handleSearchDia}
                                    disabled={!newItem.sphericalPower || isGetDiameterLoading}
                                    variant="outline"
                                >
                                    {isGetDiameterLoading ? "Fetching..." : <HardDriveDownload />}
                                </Button>
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleOlSearch}
                            disabled={isPowerDetailsLoading || !newItem.sphericalPower || !newItem.diameter}
                            variant="outline"
                        >
                            {isPowerDetailsLoading ? "Searching..." : <SearchIcon />}
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isPowerDetailsLoading}
                            variant="outline"
                        >
                            {isPowerDetailsLoading ? "Refreshing..." : <RefreshCcw />}
                        </Button>
                    </TableCell>
                </TableRow>
            )}
        />
    )
}