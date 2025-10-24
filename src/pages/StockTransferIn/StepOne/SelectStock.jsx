import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useOrder } from "../../../features/OrderContext";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/Button";
import { Autocomplete, TextField } from "@mui/material";
import {
  useGetSelectStockQuery,
  useLazyGetSTKIDraftDataQuery,
  useSaveSTKIDraftMutation,
} from "../../../api/stockTransfer";
import toast from "react-hot-toast";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { format } from "date-fns";
import { formatINR } from "../../../utils/formatINR";
import Radio from "../../../components/Form/Radio";

const SelectStock = () => {
  const {
    setStockTransferInDraftData,
    customerStockTransferIn,
    setCustomerStockTransferIn,
    currentStockTransferInStep,
    goToStockTransferInStep,
    prevStockTransferInStep,
  } = useOrder();
  const navigate = useNavigate();
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [selectedStock, setSelectedStock] = useState(null);

  const { data: stockData, isLoading: isStockLoading } = useGetSelectStockQuery(
    { locationId: parseInt(hasMultipleLocations[0]) }
  );

  const [saveDraft, { isLoading: isDraftSavingLoading }] =
    useSaveSTKIDraftMutation();

  const [getDraftData, { data: draftData, isLoading: isDraftLoading }] =
    useLazyGetSTKIDraftDataQuery();
  const handleSave = async () => {
    if (!selectedStock) {
      toast.error("Please select preferred stock!");
      return;
    }

    try {
      const res = await getDraftData({
        locationId: parseInt(hasMultipleLocations[0]),
        mainId: selectedStock?.STOutMainId,
        userId: user.Id,
      }).unwrap();

      const draft = res?.data[0];
      const existDraft =
        draft?.Status === 0 &&
        draft?.STOutMainId === selectedStock?.STOutMainId &&
        draft?.CompanyId === parseInt(hasMultipleLocations[0]) &&
        draft?.ApplicationUserID === user.Id;

      if (existDraft) {
        setCustomerStockTransferIn((prev) => ({
          ...prev,
          mainId: draft.STOutMainId,
        }));
        setStockTransferInDraftData(draft);
        goToStockTransferInStep(4);
        return;
      }
    } catch (error) {
      toast.error(error?.data.error);
      return;
    }

    try {
      const response = await saveDraft({
        locationId: parseInt(hasMultipleLocations[0]),
        mainId: selectedStock?.STOutMainId,
        userId: user.Id,
      }).unwrap();
      toast.success("Stock transfer In successfully created!");
      setCustomerStockTransferIn((prev) => ({
        ...prev,
        mainId: response?.data.STOutMainId,
      }));
      setStockTransferInDraftData(response?.data);
      goToStockTransferInStep(2);
    } catch (error) {
      toast.error(error.data.error.message);
    }
  };
  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between mb-5">
              <h1 className="text-2xl font-bold text-gray-900">
                Step {currentStockTransferInStep}
              </h1>

              <div>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Back
                </Button>
              </div>
            </div>
            <Table
              expand={true}
              columns={[
                "#",
                "Stock Out Request Location",
                "Date",
                "Total Qty",
                "Total Value",
              ]}
              data={stockData?.data?.filter(item => item.Status !== 4) || []}
              renderRow={(item, index) => (
                <TableRow key={item.STOutMainId}>
                  <TableCell>
                    <Radio
                      name="Stock"
                      onChange={() => setSelectedStock(item)}
                      checked={selectedStock?.STOutMainId === item.STOutMainId}
                      value={selectedStock?.selectedStock}
                    />
                  </TableCell>
                  <TableCell>{item.StockOutRequest}</TableCell>
                  <TableCell>
                    {item.Date ? format(new Date(item.Date), "dd/MM/yyyy") : ""}
                  </TableCell>
                  <TableCell>{item.TotalQty}</TableCell>
                  <TableCell> ₹{formatINR(item.TotalValue)}</TableCell>
                </TableRow>
              )}
              emptyMessage={isStockLoading ? "Loading..":"No data found!"}
            />

            {selectedStock && (
              <div className="flex justify-end mt-5">
                <Button
                  onClick={handleSave}
                  isLoading={isDraftSavingLoading || isDraftLoading}
                  disabled={isDraftSavingLoading || isDraftLoading}
                >
                  Select & Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectStock;
