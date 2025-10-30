import { Autocomplete, TextField, createFilterOptions } from "@mui/material";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useOrder } from "../../features/OrderContext";
import { useGetPatientsQuery } from "../../api/salesReturnApi";
import { useSelector } from "react-redux";
import Radio from "../../components/Form/Radio";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import { useGetFamilyHistoryPaymentsQuery } from "../../api/reportApi";
import { Table, TableCell, TableRow } from "../../components/Table";
import { format } from "date-fns";
import { FiEye } from "react-icons/fi";
import Modal from "../../components/ui/Modal";
import OrderView from "../Order/MainOrder/OrderView";
import { formatINR } from "../../utils/formatINR";

const getOrderStatus = (status) => {
  const types = {
    1: "Confirmed",
    2: "Partially Invoiced",
    3: "Invoiced",
    4: "Cancelled",
  };
  return types[status] || "Draft";
};

const CustomerFamilyHistory = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { hasMultipleLocations, user } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isOrderView, setIsOrderView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: contactResp, isLoading: isPatientLoading } =
    useGetPatientsQuery({ locationId: parseInt(hasMultipleLocations[0]) });
  const { data: orderSummary, isLoading: isOrderDataLoading } =
    useGetFamilyHistoryPaymentsQuery(selectedPatient?.mainCustomerObject?.Id);

  const allContacts = useMemo(() => {
    if (!contactResp?.data?.data) return [];

    const patients = contactResp.data.data.flatMap((mainCustomer) =>
      mainCustomer.CustomerContactDetails.map((contact) => ({
        ...contact,
        mainCustomerObject: mainCustomer, // attach main customer
      }))
    );

    // Remove duplicates based on both name + mobile
    return patients.filter(
      (p, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.CustomerName?.trim().toLowerCase() ===
              p.CustomerName?.trim().toLowerCase() &&
            t.MobNumber === p.MobNumber
        )
    );
  }, [contactResp]);

  // Allow search by both name and mobile
  const filter = createFilterOptions({
    stringify: (option) => `${option.CustomerName} ${option.MobNumber}`,
  });
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = orderSummary?.allOrders?.slice(
    startIndex,
    startIndex + pageSize
  );
  const totalPages = Math.ceil(orderSummary?.allOrders?.length / pageSize);

  const totalOrders = orderSummary?.allOrders?.length || 0;
  const filteredOrders = orderSummary?.allOrders?.length;
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderView(true);
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between">
              <div className="text-neutral-800 text-2xl font-semibold">
                Customer Family History
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/sales-return")}
                >
                  Back
                </Button>
              </div>
            </div>
            <div className="w-1/2 mt-3">
              <label className="font-medium text-neutral-700">
                Select Patient
              </label>
              <Autocomplete
                options={allContacts}
                getOptionLabel={(option) =>
                  `${option.CustomerName} (${option.MobNumber})`
                }
                filterOptions={filter}
                value={
                  allContacts.find(
                    (contact) => contact.Id === selectedPatient?.Id
                  ) || null
                }
                onChange={(_, newValue) => {
                  setSelectedPatient(newValue || null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select by Patient name or mobile"
                    size="medium"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.Id === value.Id}
                loading={isPatientLoading}
                fullWidth
              />
            </div>
            {selectedPatient && (
              <div>
                {selectedPatient && (
                  <div className="my-5 grid grid-cols-5 gap-4 text-sm">
                    <div className="flex gap-1">
                      <strong>Customer Name:</strong>
                      {selectedPatient.CustomerName}
                    </div>
                    <div className="flex gap-1">
                      <strong>Mobile Number:</strong>
                      {selectedPatient.MobNumber}
                    </div>
                  </div>
                )}
                <div className="my-5 space-y-4">
                  <div>
                    {/* Other Members Section */}
                    {orderSummary?.customer?.CustomerContactDetails &&
                      (() => {
                        const otherMembers =
                          orderSummary.customer.CustomerContactDetails.filter(
                            (item) =>
                              item.MobNumber !== selectedPatient?.MobNumber &&
                              item.CustomerName?.trim().toLowerCase() !==
                                selectedPatient?.CustomerName?.trim().toLowerCase()
                          ) || [];

                        // If no other members exist, return nothing (hide section)
                        if (otherMembers.length === 0) return null;

                        return (
                          <div>
                            <div className="text-lg font-semibold my-5">
                              Other Members
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              {otherMembers.map((item) => (
                                <div
                                  key={item.Id}
                                  className="border border-neutral-400 p-4 flex flex-col gap-3 rounded-lg"
                                >
                                  <strong>
                                    Patient Name: {item.CustomerName}
                                  </strong>
                                  <strong>Patient Mob: {item.MobNumber}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                  <div>
                    <strong>Total Orders:</strong>{" "}
                    {orderSummary?.orderSummary?.totalOrders}
                  </div>
                  <div>
                    <strong> Total Order Value:</strong> ₹
                    {formatINR(orderSummary?.orderSummary?.totalValue)}
                  </div>
                  <div>
                    <strong>Loyalty Points Balance:</strong>{" "}
                    {orderSummary?.orderSummary?.loyaltyPointsBalance}
                  </div>
                </div>
                <Table
                  columns={[
                    "S.No",
                    "Order No",
                    "Date",
                    "Patient Name",
                    "Customer Name",
                    "Mobile No",
                    "Order Qty",
                    "Order Value",
                    "Status",
                    "Action",
                  ]}
                  data={paginatedOrders || []}
                  renderRow={(order, index) => (
                    <TableRow key={order.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{`${order.OrderPrefix}/${order.OrderNo} `}</TableCell>
                      <TableCell>
                        {format(new Date(order.OrderPlacedDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {order.CustomerContactDetail?.CustomerName}
                      </TableCell>
                      <TableCell>
                        {order.CustomerMaster?.CustomerName}
                      </TableCell>
                      <TableCell>
                        {order.CustomerContactDetail?.MobNumber}
                      </TableCell>
                      <TableCell>{order.TotalQty}</TableCell>
                      <TableCell>{order.TotalValue}</TableCell>
                      <TableCell>{getOrderStatus(order.Status)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="flex items-center  text-lg font-medium rounded-md "
                          title="View"
                        >
                          <FiEye className="" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                  emptyMessage={
                    isOrderDataLoading
                      ? "Loading orders..."
                      : "No orders match the filters."
                  }
                  pagination={true}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  totalItems={filteredOrders}
                />

                <Modal
                  isOpen={isOrderView}
                  onClose={() => setIsOrderView(false)}
                  width="max-w-7xl"
                >
                  <OrderView
                    isFamily={true}
                    orderFamilyId={selectedOrder?.Id}
                  />
                </Modal>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFamilyHistory;
