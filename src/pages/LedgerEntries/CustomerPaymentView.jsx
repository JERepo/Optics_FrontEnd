import React from "react";
import Button from "../../components/ui/Button";
import { useLocation, useNavigate } from "react-router";
import { useGetPaymentsByIdQuery } from "../../api/customerPayment";
import Loader from "../../components/ui/Loader";
import { Table, TableCell, TableRow } from "../../components/Table";
import { format } from "date-fns";
import { formatINR } from "../../utils/formatINR";

const CustomerPaymentView = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const cpId = params.get("cpId");
  const { data: details, isLoading } = useGetPaymentsByIdQuery(cpId);

  if (isLoading) {
    return (
      <div>
        <Loader color="black" />
      </div>
    );
  }
  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="text-neutral-800 text-2xl font-semibold">
              Customer Payment Details
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/customer-payment")}
              >
                Back
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Info
              label="Customer Name"
              value={details?.data.customer?.CustomerName}
            />

            <Info
              label="Customer Mobile No"
              value={details?.data.customer?.MobNumber}
            />
          </div>
          <div className="mt-10">
            <Table
              columns={["S.No", "Type", "gv code", "reference date", "amount"]}
              data={details?.data.payments || []}
              renderRow={(c, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {c.type
                      ? c.type
                          .replace(/([A-Z])/g, " $1") // split camelCase → "gift Voucher"
                          .replace(/^./, (str) => str.toUpperCase()) // capitalize first letter → "Gift Voucher"
                      : ""}
                  </TableCell>

                  <TableCell>
                    {c.typeNum === 7 ? c.extra.GVCode : "-"}
                  </TableCell>
                  <TableCell>
                    {c.typeNum === 6 && c.extra?.AdvanceDate
                      ? format(new Date(c.extra.AdvanceDate), "dd/MM/yyyy")
                      : ""}
                  </TableCell>

                  <TableCell>₹{formatINR(c.amount)}</TableCell>
                </TableRow>
              )}
              emptyMessage={isLoading ? "Loading..." : "No data available"}
            />
          </div>

          {details?.data?.payments?.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 flex justify-end">
              <div className="">
                <div className="flex flex-col">
                  <span className="text-neutral-700 font-semibold text-lg">
                    Total Amount
                  </span>
                  <span className="text-neutral-600 text-xl font-medium">
                    ₹{formatINR(
                      details?.data?.payments?.reduce(
                        (sum, item) => sum + parseFloat(item.amount),
                        0
                      )
                    ) || "0"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentView;

const Info = ({ label, value }) => (
  <div className="flex flex-col">
    <div className="text-neutral-700 font-semibold text-lg">{label}</div>
    <div className="text-neutral-600">
      {value !== null && value !== undefined && value !== "" ? value : "N/A"}
    </div>
  </div>
);
