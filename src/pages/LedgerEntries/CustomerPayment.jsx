import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  useGetAllCustomersQuery,
  useGetCompanyIdQuery,
} from "../../api/customerApi";
import Button from "../../components/ui/Button";
import { Autocomplete, TextField } from "@mui/material";
import { useGetLocationByIdQuery } from "../../api/roleManagementApi";
import { Table, TableCell, TableRow } from "../../components/Table";
import { useLazyGetCustomerPaymentQuery } from "../../api/customerPayment";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { formatINR } from "../../utils/formatINR";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";
import Modal from "../../components/ui/Modal";
import Checkbox from "../../components/Form/Checkbox";
import PaymentEntries from "./PaymentEntries";
import CollectAdvance from "./CollectAdvace";

const CustomerPayment = () => {
  const navigate = useNavigate();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [input, setInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editMode, setEditMode] = useState({});
  const [items, setItems] = useState([]);
  const [nextClicked, setNextClicked] = useState(false);
  const [collectPayment, setCollectPayment] = useState(false);

  const {
    data: customersResp,
    isLoading,
    isFetching,
  } = useGetAllCustomersQuery();
  const { data: locationById } = useGetLocationByIdQuery(
    { id: parseInt(hasMultipleLocations[0]) },
    { skip: !parseInt(hasMultipleLocations[0]) }
  );
  const companyId = locationById?.data?.data.Id;

  const { data: companySettings } = useGetCompanyIdQuery(
    { id: companyId },
    { skip: !companyId }
  );
  const CustomerPoolID = companySettings?.data?.data.CustomerPoolID;

  const [getPayments, { isFetching: isPaymentsLoading }] =
    useLazyGetCustomerPaymentQuery();

  // Initialize editMode and set originalAmountToPay for each item
  useEffect(() => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      items.forEach((item, index) => {
        const key = index;
        if (!newEditMode[key]) {
          newEditMode[key] = {
            BuyingPrice: false,
            originalAmountToPay: item.AmountToPay || item.Amount, // Use AmountToPay or Amount
          };
        }
      });
      return newEditMode;
    });
  }, [items]);

  // Fetch payments and initialize AmountToPay to Amount
  const handleFetch = async () => {
    try {
      const res = await getPayments({
        companyId: parseInt(hasMultipleLocations[0]),
        customerId: selectedCustomer?.Id,
      }).unwrap();
      if (res?.data?.length > 0) {
        // Initialize AmountToPay to Amount (Amount Due) for each item
        const updatedItems = res.data.map((item) => ({
          ...item,
          AmountToPay: item.Invoice
            ? item.AmountToPay ?? item.Amount
            : -(item.AmountToPay ?? item.Amount),
        }));
        setItems(updatedItems);
        toast.success("Payment Details Fetched Successfully!");
      } else {
        toast.error("No payment details found!");
        setItems([]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch payment details.");
    }
  };

  const toggleEditMode = (index, field, action = "toggle") => {
    setEditMode((prev) => {
      const key = index;
      const currentMode = prev[key]?.[field];
      const item = items[index];

      if (field === "BuyingPrice" && !currentMode) {
        // Entering edit mode
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: true,
            originalAmountToPay: item.AmountToPay,
          },
        };
      }

      if (currentMode && action === "cancel") {
        // Cancel edit: restore original AmountToPay
        setItems((prevItems) =>
          prevItems.map((i, idx) =>
            idx === index
              ? { ...i, AmountToPay: prev[key].originalAmountToPay }
              : i
          )
        );
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: !currentMode,
          originalAmountToPay: prev[key]?.originalAmountToPay,
        },
      };
    });
  };

  const handleSellingPriceChange = (index, price) => {
    const newPrice = Number(price);
    const item = items[index];

    // Validate that AmountToPay does not exceed Amount Due
    if (newPrice > item.Amount) {
      toast.error("Amount to Pay cannot exceed Amount Due!");
      return;
    }

    // Validate that AmountToPay is not negative
    if (newPrice < 0) {
      toast.error("Amount to Pay cannot be negative!");
      return;
    }

    // Update AmountToPay for the item
    setItems((prev) =>
      prev.map((i, idx) =>
        idx === index ? { ...i, AmountToPay: newPrice } : i
      )
    );
  };

  const handleProductSelection = (order) => {
    setSelectedProducts((prev) => {
      if (prev.includes(order.Id)) {
        return prev.filter((Id) => Id !== order.Id);
      }
      return [...prev, order.Id];
    });
  };

  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      const allOrderIds = items.map((order) => order.Id);
      setSelectedProducts(allOrderIds);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleCollectPayment = () => {
    setNextClicked(true);
  };
  const totalReceivable = items.reduce((sum, item) => {
    if (selectedProducts.includes(item.Id)) {
      const amount = item.Invoice
        ? parseFloat(item.Amount)
        : -parseFloat(item.Amount);
      return sum + amount;
    }
    return sum;
  }, 0);

  const totalSelectedValue = items.reduce((sum, item) => {
    if (selectedProducts.includes(item.Id)) {
      const amountToPay = parseFloat(item.AmountToPay);
      return sum + amountToPay;
    }
    return sum;
  }, 0);

  useEffect(() => {
    if (collectPayment) {
      setItems([]);
      setNextClicked(true);
    }
  }, [collectPayment]);

  return (
    <div>
      <div className="max-w-8xl p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between">
          <div className="w-1/2">
            <Autocomplete
              options={
                customersResp?.data?.data.filter(
                  (item) => item.Company?.Id === CustomerPoolID
                ) || []
              }
              getOptionLabel={(option) =>
                `${option.CustomerName} (${option.MobNumber})`
              }
              value={
                customersResp?.data?.data.find(
                  (master) => master.Id === selectedCustomer?.Id
                ) || null
              }
              onChange={(_, newValue) => setSelectedCustomer(newValue || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select by Customer Name or Mobile"
                  size="medium"
                />
              )}
              isOptionEqualToValue={(option, value) =>
                option.CustomerMasterID === value.CustomerMasterID
              }
              loading={isLoading}
              fullWidth
            />
          </div>
          <div>
            <Button variant="outline" onClick={() => navigate("/invoice")}>
              Back
            </Button>
          </div>
        </div>
        {selectedCustomer && (
          <div className="flex justify-between mt-5 items-center">
            {items.length > 0 && (
              <div className="text-lg text-neutral-900">
                <Checkbox
                  checked={collectPayment}
                  onChange={(e) => setCollectPayment(e.target.checked)}
                  label="Collect Advance"
                />
              </div>
            )}
            <Button
              onClick={handleFetch}
              isLoading={isPaymentsLoading}
              disabled={isPaymentsLoading}
            >
              Fetch Details
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <Table
            className="mt-5"
            columns={[
              "#",
              "doc no",
              "dr/cr",
              "doc date",
              "total amount",
              "amount due",
              "amount to pay",
              "location",
            ]}
            data={items || []}
            renderHeader={(column) => {
              if (column === "#") {
                const allSelected =
                  items?.length > 0 && selectedProducts.length === items.length;
                return (
                  <div className="flex items-center gap-1">
                    {column}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAllProducts}
                      className="h-3 w-3"
                      disabled={nextClicked}
                    />
                  </div>
                );
              }
              return <>{column}</>;
            }}
            renderRow={(item, index) => (
              <TableRow key={item.Id}>
                <TableCell>
                  <input
                    type="checkbox"
                    onChange={() => handleProductSelection(item)}
                    className="h-5 w-5"
                    checked={selectedProducts.includes(item.Id)}
                    disabled={nextClicked}
                  />
                </TableCell>
                <TableCell>
                  {item.Invoice
                    ? `${item.Invoice?.InvoicePrefix}/${item.Invoice?.InvoiceNo}`
                    : `${item.salesMaster?.CNPrefix}/${item.salesMaster?.CNNo}`}
                </TableCell>
                <TableCell>{item.Invoice ? "DR" : "CR"}</TableCell>
                <TableCell>
                  {item.Invoice
                    ? format(new Date(item.Invoice?.InvoiceDate), "dd/MM/yyyy")
                    : format(new Date(item.salesMaster?.CNDate), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  ₹
                  {item.Invoice
                    ? item.Invoice?.TotalValue
                    : item.salesMaster?.CNTotal}
                </TableCell>
                <TableCell>₹{formatINR(item.Amount)}</TableCell>
                <TableCell>
                  {editMode[index]?.BuyingPrice ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={item.AmountToPay || ""}
                        onChange={(e) =>
                          handleSellingPriceChange(index, e.target.value)
                        }
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Enter price"
                      />
                      <button
                        onClick={() =>
                          toggleEditMode(index, "BuyingPrice", "save")
                        }
                        className="text-neutral-400 transition"
                        title="Save"
                      >
                        <FiCheck size={18} />
                      </button>
                      <button
                        onClick={() =>
                          toggleEditMode(index, "BuyingPrice", "cancel")
                        }
                        className="text-neutral-400 transition"
                        title="Cancel"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      ₹{formatINR(item.AmountToPay)}
                      <button
                        onClick={() => toggleEditMode(index, "BuyingPrice")}
                        className="text-neutral-400 transition"
                        title="Edit Price"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell>{item.location?.LocationName}</TableCell>
              </TableRow>
            )}
          />
        )}

        {items.length > 0 && (
          <div className="flex gap-10 justify-end mt-5 p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-6">
              <span className="text-lg font-semibold">
                Total Receivable: ₹{formatINR(totalReceivable)}
              </span>
              <span className="text-lg font-semibold">
                Total Amount to Pay: ₹{formatINR(totalSelectedValue)}
              </span>
            </div>
          </div>
        )}

        {selectedProducts?.length > 0 && totalSelectedValue > 0 && (
          <div className="mt-5 flex justify-end">
            <Button onClick={handleCollectPayment}>Next</Button>
          </div>
        )}

        <Modal
          isOpen={nextClicked && !collectPayment}
          onClose={() => setNextClicked(false)}
          width="max-w-5xl"
        >
          <div>
            <PaymentEntries
              totalValue={totalReceivable || 0}
              amountToPay={totalSelectedValue || 0}
              selectedPatient={selectedCustomer || 0}
              companyId={parseInt(hasMultipleLocations[0])}
              items={items}
            />
          </div>
        </Modal>
        <Modal
          isOpen={nextClicked && collectPayment}
          onClose={() => setNextClicked(false)}
          width="max-w-5xl"
        >
          <div>
            <CollectAdvance
              totalValue={totalReceivable || 0}
              amountToPay={totalSelectedValue || 0}
              selectedPatient={selectedCustomer || 0}
              companyId={parseInt(hasMultipleLocations[0])}
              items={items}
              collectPayment={collectPayment}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CustomerPayment;
