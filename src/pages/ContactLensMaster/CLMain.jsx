import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import Button from "../../components/ui/Button";
import { useOrder } from "../../features/OrderContext";
import { Table, TableCell, TableRow } from "../../components/Table";
import { enGB } from "date-fns/locale";
import Loader from "../../components/ui/Loader";
import { useSelector } from "react-redux";
import { useGetAllInvoiceQuery } from "../../api/InvoiceApi";
import HasPermission from "../../components/HasPermission";
import {
  useGetAllCLMastersQuery,
  useUpdateCLMainMutation,
} from "../../api/contactlensMaster";
import Toggle from "../../components/ui/Toggle";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

const getOrderStatus = (status) => {
  const types = {
    1: "Confirmed",
    2: "Partially Cancelled",
    3: "Cancelled",
  };
  return types[status] || "Draft";
};

const CLMain = () => {
  const navigate = useNavigate();
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const { goToStep, updateSelectedOrderDetails } = useOrder();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: allCL, isLoading: isClLoading } = useGetAllCLMastersQuery();
  const [deActivate, { isLoading: isDeActivating }] = useUpdateCLMainMutation();

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchQuery]);

  const clMasters = useMemo(() => {
    if (!allCL?.data) return [];

    let filtered = allCL?.data;

    if (fromDate) {
      filtered = filtered.filter(
        (order) => new Date(order.CreatedOn) >= fromDate
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (order) => new Date(order.CreatedOn) <= toDate
      );
    }

    // if (searchQuery) {
    //   filtered = filtered.filter((invoice) => {
    //     const query = searchQuery.toLowerCase();

    //     const customerName =
    //       invoice.CustomerMaster?.CustomerName?.toLowerCase() || "";
    //     const patientName = invoice.Patient?.CustomerName?.toLowerCase() || "";
    //     const patientMobile =
    //       invoice.CustomerMaster?.MobNumber?.toLowerCase() || "";
    //     const invoiceNo = String(invoice.InvoiceNo)?.toLowerCase() || "";

    //     return (
    //       customerName.includes(query) ||
    //       patientName.includes(query) ||
    //       patientMobile.includes(query) ||
    //       invoiceNo.includes(query)
    //     );
    //   });
    // }

    return filtered.map((cl) => ({
      id: cl.Id,
      brandName: cl.Brand?.BrandName,
      productCode: cl.ProductCode,
      productName: cl.ProductName,
      enabled: cl.IsActive === 1,
      all: cl,
    }));
    // .filter((order) => order.CompanyID === parseInt(hasMultipleLocations[0]));
  }, [allCL?.data, fromDate, toDate, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = clMasters.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(clMasters.length / pageSize);

  const totalOrders = allCL?.data?.length || 0;
  const filteredOrders = clMasters.length;
  const today = new Date();
  const requestToggle = (id, status) => {
    setSelectedId(id);
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

  const handleEdit = (id) => {
    navigate(`/contact-lens-master/${id}`);
  };
  const handleConfirmToggle = async () => {
    try {
      await deActivate({
        id: selectedId,

        payload: { IsActive: currentStatus ? 0 : 1 },
      }).unwrap();
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setIsModalOpen(false);
      setSelectedId(null);
      setCurrentStatus(null);
    }
  };

  if (isClLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader color="black" width="w-10" height="h-10" />
      </div>
    );
  }
  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Contact Lens Master
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={enGB}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
                maxDate={today}
                inputFormat="dd/MM/yyyy"
                renderInput={(params) => (
                  <TextField
                    inputProps={{
                      ...params.inputProps,
                      placeholder: "dd/MM/yyyy",
                    }}
                    size="small"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={setToDate}
                minDate={fromDate}
                maxDate={today}
                inputFormat="dd/MM/yyyy"
                renderInput={(params) => (
                  <TextField
                    inputProps={{
                      ...params.inputProps,
                      placeholder: "dd/MM/yyyy",
                    }}
                    placeholder="dd/MM/yyyy"
                    size="small"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
              <div className="grid grid-cols-2 gap-3 items-center">
                <Button
                  icon={FiSearch}
                  className="bg-blue-600 hover:bg-blue-700 h-10 w-full md:w-auto justify-center"
                  onClick={() => {}}
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={() => {
                    setFromDate(null);
                    setToDate(null);
                    setSearchQuery("");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </LocalizationProvider>
        </div>

        {/* Table */}
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-5">
              <h2 className="text-lg font-medium text-gray-900">
                Contact Lens Master Details
              </h2>

              <div className="relative flex items-center w-full sm:w-64">
                <FiSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* <HasPermission module="Invoice" action="create"> */}
              <Button
                icon={FiPlus}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
                onClick={() => {
                  navigate("/contact-lens-master/create");
                }}
              >
                Add CL
              </Button>
              {/* </HasPermission> */}
            </div>
          </div>

          <Table
            columns={[
              "S.No",
              "brand name",
              "product code",
              "product name",
              "action",
            ]}
            data={paginatedOrders}
            renderRow={(item, index) => (
              <TableRow key={item.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{item.brandName}</TableCell>
                <TableCell>{item.productCode}</TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="text-neutral-600 hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <Toggle
                    enabled={item.enabled}
                    onToggle={() => requestToggle(item.id, item.enabled)}
                  />
                </TableCell>
              </TableRow>
            )}
            emptyMessage={
              isClLoading
                ? "Loading contact lens..."
                : "No cl match the filters."
            }
            pagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={filteredOrders}
          />
        </div>
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmToggle}
          title={`Are you sure you want to ${
            currentStatus ? "deactivate" : "activate"
          } this Contact Lens Master?`}
          message={`This will ${
            currentStatus ? "deactivate" : "activate"
          } the Contact Lens Master. You can change it again later.`}
          confirmText={currentStatus ? "Deactivate" : "Activate"}
          danger={currentStatus}
          isLoading={isDeActivating}
        />
      </div>
    </div>
  );
};

export default CLMain;
