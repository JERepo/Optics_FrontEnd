import React from "react";
import Button from "../../../components/ui/Button";
import { useLocation, useNavigate } from "react-router";
import { useGetPaymentsByIdQuery } from "../../../api/customerPayment";
import Loader from "../../../components/ui/Loader";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { format } from "date-fns";
import { formatINR } from "../../../utils/formatINR";

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
              value={details?.data.receiptMain?.CustomerMaster?.CustomerName}
            />

            <Info
              label="Customer Mobile No"
              value={details?.data.receiptMain?.CustomerMaster?.MobNumber}
            />
          </div>
          <div className="mt-10">
            <Table
              columns={[
                "S.No",
                "Type",
                "Amount",
                "Ref No",
                "Payment Machine",
                "Bank Name",
                "Cheque Details",
                "Account Number",
              ]}
              data={details?.data?.payments || []}
              renderRow={(c, index) => {
                let paymentAmount = 0;
                switch (c.type?.toLowerCase()) {
                  case "cash":
                    paymentAmount = c?.data?.CashAmount;
                    break;
                  case "card":
                    paymentAmount = c?.data?.CardAmount;
                    break;
                  case "upi":
                    paymentAmount = c?.data?.UPIAmount;
                    break;
                  case "cheque":
                    paymentAmount = c?.data?.ChequeAmount;
                    break;
                  case "banktransfer":
                    paymentAmount = c?.data?.BTAmount;
                    break;
                  case "advance":
                    paymentAmount = c?.data?.AdvanceAmount;
                    break;
                  case "giftvoucher":
                    paymentAmount = c?.data?.GVAmount;
                    break;
                  default:
                    paymentAmount = c?.amount || 0;
                }

                return (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{c.type || ""}</TableCell>

                    <TableCell>₹{formatINR(Math.abs(paymentAmount))}</TableCell>

                    <TableCell>
                      {c?.data?.ApprCode || c?.data?.ReferenceNo || "-"}
                    </TableCell>
                    <TableCell>
                      {c?.data?.PaymentMachine?.MachineName || "-"}
                    </TableCell>

                    <TableCell>
                      {c?.data?.BankMaster?.BankName ||
                        c?.data?.BankAccountDetail?.Bank?.BankName ||
                        "-"}
                    </TableCell>

                    <TableCell className="whitespace-pre-wrap">
                      {c?.data?.ChequeNo || c?.data?.ChequeDate ? (
                        <>
                          <div>Cheque No: {c?.data?.ChequeNo || "-"}</div>
                          <div>
                            Cheque Date:{" "}
                            {c?.data?.ChequeDate
                              ? c?.data?.ChequeDate.split("-")
                                  .reverse()
                                  .join("-")
                              : "-"}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>
                      {c?.data?.BankAccountDetail?.AccountNo || "-"}
                    </TableCell>
                  </TableRow>
                );
              }}
              emptyMessage={isLoading ? "Loading..." : "No data available"}
            />
          </div>

          {details?.data?.payments?.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 flex justify-end">
              <div className="">
                <div className="flex flex-col items-end">
                  <span className="text-neutral-700 font-semibold text-lg">
                    Total Amount
                  </span>
                  <span className="text-neutral-600 text-xl font-medium">
                    ₹
                    {formatINR(
                      Math.abs(
                        details.data.payments.reduce((sum, c) => {
                          let amount = 0;
                          switch (c.type?.toLowerCase()) {
                            case "cash":
                              amount = parseFloat(c?.data?.CashAmount || 0);
                              break;
                            case "card":
                              amount = parseFloat(c?.data?.CardAmount || 0);
                              break;
                            case "upi":
                              amount = parseFloat(c?.data?.UPIAmount || 0);
                              break;
                            case "cheque":
                              amount = parseFloat(c?.data?.ChequeAmount || 0);
                              break;
                            case "banktransfer":
                              amount = parseFloat(c?.data?.BTAmount || 0);
                              break;
                            case "advance":
                              amount = parseFloat(c?.data?.AdvanceAmount || 0);
                              break;
                            case "giftvoucher":
                              amount = parseFloat(c?.data?.GVAmount || 0);
                              break;
                            default:
                              amount = parseFloat(c?.amount || 0);
                          }
                          return sum + amount;
                        }, 0)
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
