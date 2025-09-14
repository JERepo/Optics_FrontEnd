import React, { useRef, useState } from "react";
import Button from "../../../components/ui/Button";
import Radio from "../../../components/Form/Radio";
import { FiSearch, FiTrash2 } from "react-icons/fi";
import {
  useActivateVoucherCodeMutation,
  useLazyGetSampleExcelQuery,
  useLazyValidateGiftVoucherQuery,
  useUploadFileMutation,
} from "../../../api/giftVoucher";
import toast from "react-hot-toast";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { addDays, format } from "date-fns";

const ActiveteGV = () => {
  const [gv, setGV] = useState(0);
  const [giftCode, setGiftCode] = useState("");
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [
    validateGiftVoucher,
    { data: validateGiftData, isFetching: isGiftVoucherChecking },
  ] = useLazyValidateGiftVoucherQuery();
  const [activateGV, { isLoading: isActivatingGV }] =
    useActivateVoucherCodeMutation();
  const [getSampleFile, { isFetching: isSheetFetching }] =
    useLazyGetSampleExcelQuery();
  const [uploadGiftVoucherFile, { isLoading: isFileUploading }] =
    useUploadFileMutation();
  const handleDelete = (id, index) => {
    setItems((prev) =>
      prev.filter((i, idx) => !(i.GVCode === id && idx === index))
    );
  };
  const handleCheckVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await validateGiftVoucher({
        GVCode: giftCode,
        CustomerID: null,
      }).unwrap();

      if (res?.data) {
        toast.success("Gift Voucher Found!");
        setItems((prev) => {
          const index = prev.findIndex((i) => i.GVCode === res?.data.GVCode);
          if (index !== -1) {
            toast.error("Gift Voucher already added");
            return prev;
          } else {
            return [{ ...res?.data }, ...prev];
          }
        });
        setGiftCode(null);
      }
    } catch (error) {
      console.log(error?.data?.message);
      setGiftCode(null);
      toast.error(
        error?.data?.message || error?.error || "Invalid Gift Voucher"
      );
    }
  };

  const handleActivateGV = async () => {
    try {
      const payload = {
        codes: items.map((item) => item.GVCode),
      };

      const res = await activateGV({ payload }).unwrap();
      if (res?.data) {
        toast.success(res?.data);
        setItems([]);

      }
    } catch (error) {
      toast.error(error?.data?.error || error?.error || "Invalid Gift Voucher");
    }
  };
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };
  const handleDownloadSampleFile = async () => {
    try {
      const blob = await getSampleFile().unwrap();
      downloadFile(blob, "SampleGiftVoucher.xlsx");
      toast.success("Sample file downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.data?.error || error?.error?.message || "Download failed"
      );
    }
  };
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    toast.success("File selected successfully");
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await uploadGiftVoucherFile(formData).unwrap();

      toast.success(res?.message || "File uploaded successfully!");

      if (res?.data) {
        setItems(res.data);
      }

      handleClearFile();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.data?.error || error?.error || "Upload failed");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="text-2xl text-neutral-700 font-semibold">
              Activate Gift Voucher
            </div>
            {/* <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button variant="outline">Back</Button>
            </div> */}
          </div>

          <div>
            <div className="mt-5">
              <div className="flex items-center gap-5 mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Gift Voucher
                </label>
                <div className="flex items-center gap-5">
                  <Radio
                    value="0"
                    label="Enter GV"
                    onChange={() => setGV(0)}
                    checked={gv === 0}
                  />
                  <Radio
                    value="1"
                    label="Bulk upload"
                    onChange={() => setGV(1)}
                    checked={gv === 1}
                  />
                </div>
              </div>
            </div>
            {selectedFile && (
              <div className="mt-3 p-3 border rounded-lg bg-gray-50 w-1/2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
            {gv === 0 && (
              <form onSubmit={handleCheckVoucher} className="space-y-2 mt-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between w-1/2">
                    <label
                      htmlFor="barcode"
                      className="text-sm font-medium text-gray-700"
                    >
                      Enter Gift Code
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex items-center">
                      <input
                        id="barcode"
                        type="text"
                        placeholder="gift voucher"
                        className="w-[400px] pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                        onChange={(e) => setGiftCode(e.target.value)}
                        value={giftCode}
                      />

                      <FiSearch className="absolute left-3 text-gray-400" />
                    </div>
                    <Button
                      type="submit"
                      isLoading={isGiftVoucherChecking}
                      disabled={isGiftVoucherChecking}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
          {gv === 0 && (
            <div>
              {items.length > 0 && (
                <div className=" mt-5">
                  <Table
                    columns={[
                      "s.no",
                      "gv code",
                      "gv activation date",
                      "gv expiry date",
                      "action",
                    ]}
                    data={items}
                    renderRow={(item, index) => (
                      <TableRow key={`${item.GVCode}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.GVCode}</TableCell>
                        <TableCell>
                          {format(new Date(), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {item.GVValidityDays
                            ? format(
                                addDays(new Date(), item.GVValidityDays),
                                "dd/MM/yyyy"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDelete(item.GVCode, index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </TableCell>
                      </TableRow>
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {gv === 1 && (
            <div className="mt-5">
              <div className="flex items-center gap-5 mb-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadSampleFile}
                  isLoading={isSheetFetching}
                  disabled={isSheetFetching}
                >
                  Download Sample File
                </Button>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  id="file-upload"
                />

                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200">
                    Select File
                  </span>
                </label>

                <Button
                  variant="primary"
                  onClick={handleUpload}
                  isLoading={isFileUploading}
                  disabled={isFileUploading}
                >
                  Upload
                </Button>

                {selectedFile && (
                  <Button variant="outline" onClick={handleClearFile}>
                    Clear
                  </Button>
                )}
              </div>

              {/* File info display */}
            </div>
          )}

          {gv === 0 && (
            <div className="mt-5">
              <Button
                onClick={handleActivateGV}
                isLoading={isActivatingGV}
                disabled={isActivatingGV || items.length <= 0}
                // className={`${items.length <= 0 ? "bg-neutral-100" : ""}`}
              >
                Activate GV
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveteGV;
