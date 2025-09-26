import React, { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import { Autocomplete, TextField } from "@mui/material";
import Radio from "../../../../components/Form/Radio";
import {
  FiCalendar,
  FiClipboard,
  FiDelete,
  FiEdit,
  FiEye,
  FiFileText,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import Input from "../../../../components/Form/Input";
import {
  useCreateNewPrescriptionMutation,
  useDeActivatePrescriptionMutation,
  useGetAllPrescriptionQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
} from "../../../../api/orderApi";
import { useSelector } from "react-redux";
import Button from "../../../../components/ui/Button";
import { Table, TableCell, TableRow } from "../../../../components/Table";
import toast from "react-hot-toast";
import { useOrder } from "../../../../features/OrderContext";
import { useGetAllSalesPersonsQuery } from "../../../../api/salesPersonApi";
import HasPermission from "../../../../components/HasPermission";

const inputTableColumns = [
  "SPH",
  "CYLD",
  "Axis",
  "ADD",
  "Prism",
  "Base",
  "Acuity",
];
const baseOptions = [
  { label: "In", value: "0" },
  { label: "Out", value: "1" },
  { label: "Up", value: "2" },
  { label: "Down", value: "3" },
];

const initialEyeValues = {
  SPH: "",
  CYLD: "",
  Axis: "",
  ADD: "",
  Prism: "",
  Base: "",
  Acuity: "",
};

// Utility validations
const isQuarterStep = (val) => val === "" || Number(val) % 0.25 === 0;
const isPositive = (val) => val === "" || Number(val) > 0;
const isOneTo180 = (val) => {
  if (val === "") return true;
  const num = Number(val);
  return Number.isInteger(num) && num >= 1 && num <= 180;
};

const NewPrescription = ({
  visualAcuityOptions,
  setLensData,
  lensData,
  isPrescription,
  onClose,
}) => {
  const { customerId } = useOrder();
  const { data: allPrescriptionData } = useGetAllPrescriptionQuery({
    patientId: customerId.patientId,
  });
  const { data: salesPersons } = useGetAllSalesPersonsQuery();
  const [createPrescription, { isLoading: isSaving }] =
    useCreateNewPrescriptionMutation();
  const [updatePrescription, { isLoading: isUpdating }] =
    useUpdatePrescriptionMutation();
  const [deletePrescription, { isLoading: isDeleting }] =
    useDeActivatePrescriptionMutation();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPrescriptionId, setEditPrescriptionId] = useState(null);

  const [prescriptionData, setPrescriptionData] = useState({
    salesId: null,
    prescriptionFrom: 0,
    doctorFile: null,
    remarks: "",
  });

  const [prescriptionValues, setPrescriptionValues] = useState({
    R: { ...initialEyeValues },
    L: { ...initialEyeValues },
  });

  const [liveErrors, setLiveErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a field in one eye
  const validateSingleField = (eye, field, value, allValues) => {
    let error = "";

    const hasCYLD = allValues[eye].CYLD !== "";
    const hasAxis = allValues[eye].Axis !== "";

    switch (field) {
      case "SPH":
        if (!isQuarterStep(value)) error = `${eye} SPH must be in 0.25 steps.`;
        break;
      case "CYLD":
        if (value === "" && hasAxis)
          error = `${eye} CYLD is required when Axis is entered.`;
        else if (value !== "" && !isQuarterStep(value))
          error = `${eye} CYLD must be in 0.25 steps.`;
        break;
      case "Axis":
        if (hasCYLD && (value === "" || !isOneTo180(value)))
          error = `${eye} Axis must be a whole number and between 1 and 180.`;
        break;
      case "ADD":
        if (value && (!isQuarterStep(value) || !isPositive(value)))
          error = `${eye} ADD must be a positive number in 0.25 steps.`;
        break;
      case "Prism":
        if (value && !isPositive(value))
          error = `${eye} Prism must be positive.`;
        else if (value && !["0", "1", "2", "3"].includes(allValues[eye].Base))
          error = `${eye} Base is required when Prism is entered.`;
        break;
      case "Base":
        if (allValues[eye].Prism && !["0", "1", "2", "3"].includes(value))
          error = `${eye} Base is required when Prism is entered.`;
        break;
      default:
        break;
    }

    return error;
  };

  const validateDataField = (field, value) => {
    if (field === "remarks" && !value.trim()) return "Remarks are required.";
    return "";
  };

  const validateForm = () => {
    const errors = new Set();

    // At least one eye must have SPH
    if (!prescriptionValues.R.SPH && !prescriptionValues.L.SPH) {
      errors.add("At least one eye (R or L) must have an SPH value.");
    }

    // Eye field validations
    ["R", "L"].forEach((eye) => {
      inputTableColumns.forEach((field) => {
        const err = validateSingleField(
          eye,
          field,
          prescriptionValues[eye][field],
          prescriptionValues
        );
        if (err) errors.add(err);
      });
    });

    // Global field validations
    const salesError = validateDataField("salesId", prescriptionData.salesId);
    if (salesError) errors.add(salesError);

    const remarksError = validateDataField("remarks", prescriptionData.remarks);
    if (remarksError) errors.add(remarksError);

    return Array.from(errors);
  };

  const handleInputChange = (eye, field, value) => {
    const updated = {
      ...prescriptionValues,
      [eye]: { ...prescriptionValues[eye], [field]: value },
    };
    setPrescriptionValues(updated);

    const relatedFields = [field];
    if (["CYLD", "Axis"].includes(field)) relatedFields.push("CYLD", "Axis");
    if (["Prism", "Base"].includes(field)) relatedFields.push("Prism", "Base");

    const updatedErrors = new Set(
      liveErrors.filter(
        (e) =>
          !relatedFields.some((f) => e.includes(`${eye} ${f}`)) &&
          !e.includes("At least one eye")
      )
    );

    relatedFields.forEach((f) => {
      const err = validateSingleField(eye, f, updated[eye][f], updated);
      if (err) updatedErrors.add(err);
    });

    setLiveErrors([...updatedErrors]);
  };

  const handleDataChange = (field, value) => {
    const updatedData = { ...prescriptionData, [field]: value };
    setPrescriptionData(updatedData);

    const errors = new Set(
      liveErrors.filter((e) => !e.includes("Remarks") && !e.includes("Brand"))
    );

    const err = validateDataField(field, value);
    if (err) errors.add(err);

    setLiveErrors([...errors]);
  };

  const handleUpdate = (prescription) => {
    setIsEditMode(true);
    setEditPrescriptionId(prescription.Id);

    // Prefill prescription data
    setPrescriptionData({
      salesId: prescription.SalesPersonId,
      prescriptionFrom: prescription.PrescriptionFrom,
      doctorFile: prescription.PrescriptionDoc || null,
      remarks: prescription.Remarks || "",
    });

    // Prefill prescription values
    setPrescriptionValues({
      R: {
        SPH: prescription.RSPH || "",
        CYLD: prescription.RCYD || "",
        Axis: prescription.RAxis || "",
        ADD: prescription.RAddOn || "",
        Prism: prescription.RPrism || "",
        Base: prescription.RBase !== null ? String(prescription.RBase) : "",
        Acuity:
          prescription.RVisualAcuity !== null
            ? String(prescription.RVisualAcuity)
            : "",
      },
      L: {
        SPH: prescription.LSPH || "",
        CYLD: prescription.LCYD || "",
        Axis: prescription.LAxis || "",
        ADD: prescription.LAddOn || "",
        Prism: prescription.LPrism || "",
        Base: prescription.LBase !== null ? String(prescription.LBase) : "",
        Acuity:
          prescription.LVisualAcuity !== null
            ? String(prescription.LVisualAcuity)
            : "",
      },
    });

    // Clear any existing errors
    setLiveErrors([]);
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setLiveErrors(errors);
    if (errors.length) return;

    setIsSubmitting(true);

    const buildVal = (eye, field) =>
      prescriptionValues[eye][field] !== ""
        ? Number(prescriptionValues[eye][field])
        : null;

    const payload = {
      PatientId: customerId.patientId,
      Reference: lensData.orderReference || null,
      LSPH: buildVal("L", "SPH"),
      LCYD: buildVal("L", "CYLD"),
      LAxis: buildVal("L", "Axis"),
      LAddOn: buildVal("L", "ADD"),
      LPrism: buildVal("L", "Prism"),
      LBase: buildVal("L", "Base"),
      LVisualAcuity: buildVal("L", "Acuity"),
      RSPH: buildVal("R", "SPH"),
      RCYD: buildVal("R", "CYLD"),
      RAxis: buildVal("R", "Axis"),
      RAddOn: buildVal("R", "ADD"),
      RPrism: buildVal("R", "Prism"),
      RBase: buildVal("R", "Base"),
      RVisualAcuity: buildVal("R", "Acuity"),
      PrescriptionFrom: prescriptionData.prescriptionFrom,
      PrescriptionDoc: prescriptionData.doctorFile || null,
      Remarks: prescriptionData.remarks,
      SalesPersonId: prescriptionData.salesId,
      IsActive: 1,
      ApplicationUserId: user.Id,
    };

    if (!payload.SalesPersonId) {
      toast.error("Can't save the Prescription please select the Optometrist!");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode) {
        // Update existing prescription
        const response = await updatePrescription({
          id: editPrescriptionId,
          payload,
        }).unwrap();
        toast.success("Prescription updated successfully!");
        setIsEditMode(false);
        setEditPrescriptionId(null);
      } else {
        // Create new prescription
        const response = await createPrescription({ payload }).unwrap();
        if (!isPrescription) {
          setLensData((prev) => ({
            ...prev,
            prescriptionId: response?.data.data.Id,
            selectedPrescription: response?.data?.data,
            powerSingleORboth: 1,
          }));
        }
        toast.success("Prescription created successfully!");
      }
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      setLiveErrors(["Error submitting prescription. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = salesPersons?.data.data
    ?.filter(
      (person) =>
        person.Type === 1 &&
        person.SalesPersonLinks?.some((link) =>
          hasMultipleLocations.includes(link.Company?.Id)
        )
    )
    .map((person) => ({
      ...person,
      SalesPersonLinks: person.SalesPersonLinks.filter((link) =>
        hasMultipleLocations.includes(link.Company?.Id)
      ),
    }));

  const handleView = (prescription) => {
    const parsedPrescription = {
      ...prescription,
      values: {
        R: {
          SPH: prescription.RSPH,
          CYL: prescription.RCYD,
          Axis: prescription.RAxis,
          ADD: prescription.RAddOn,
          Prism: prescription.RPrism,
          Base: prescription.RBase,
          VisualAcuity: prescription.RVisualAcuity,
        },
        L: {
          SPH: prescription.LSPH,
          CYL: prescription.LCYD,
          Axis: prescription.LAxis,
          ADD: prescription.LAddOn,
          Prism: prescription.LPrism,
          Base: prescription.LBase,
          VisualAcuity: prescription.LVisualAcuity,
        },
      },
    };

    setSelectedPrescription(parsedPrescription);
  };
  const handleDelete = async (p) => {
    try {
      await deletePrescription({ id: p.Id }).unwrap();
      toast.success("Deleted SUccessfully!");
    } catch (error) {
      console.log(error);
      toast.error("Please try again!");
    }
  };
  return (
    <div className="mt-5 space-y-4">
      {isPrescription && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-lg font-medium text-neutral-600">
            Patient Name : {customerId.patientName}
          </div>
          <div className="flex items-center gap-3 text-lg font-medium text-neutral-600">
            Patient Mobile : {customerId.mobileNo}
          </div>
        </div>
      )}
      <div></div>
      {/* Brand Selection */}
      <div className="flex justify-between w-full items-center">
        <div className="w-1/2">
          <label className="text-sm font-medium text-gray-700">
            Optometrist
          </label>
          <Autocomplete
            options={filteredData}
            getOptionLabel={(opt) => opt.PersonName || ""}
            value={
              salesPersons?.data.data.find(
                (p) => p.Id === prescriptionData.salesId
              ) || null
            }
            onChange={(_, val) => handleDataChange("salesId", val?.Id || null)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Select Optometrist"
              />
            )}
            fullWidth
          />
        </div>
        {isPrescription && (
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
        )}
      </div>

      {/* Prescription Source */}
      <div className="w-1/2 space-y-2">
        <div className="flex items-center gap-4">
          <Radio
            label="Tested at store"
            name="from"
            value="0"
            checked={prescriptionData.prescriptionFrom === 0}
            onChange={() => handleDataChange("prescriptionFrom", 0)}
          />
          <Radio
            label="From Doctor"
            name="from"
            value="1"
            checked={prescriptionData.prescriptionFrom === 1}
            onChange={() => handleDataChange("prescriptionFrom", 1)}
          />
        </div>

        {prescriptionData.prescriptionFrom === 1 && (
          <div>
            <label
              htmlFor="doctorFile"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <FiUploadCloud className="w-4 h-4" />
              {prescriptionData.doctorFile
                ? "Change File"
                : "Upload Prescription File"}
            </label>
            <input
              id="doctorFile"
              type="file"
              accept="image/*,application/pdf"
              hidden
              onChange={(e) =>
                handleDataChange("doctorFile", e.target.files[0] || null)
              }
            />
            {prescriptionData.doctorFile && (
              <p className="text-sm mt-1 text-gray-600">
                Selected: {prescriptionData.doctorFile.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Prescription Table */}
      <table className="w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-gray-600 font-medium">Eye</th>
            {inputTableColumns.map((col) => (
              <th key={col} className="p-3 text-left text-gray-600 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["R", "L"].map((eye) => (
            <tr key={eye} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-700">{eye}</td>
              {inputTableColumns.map((field) => (
                <td key={field} className="p-3">
                  {field === "Base" || field === "Acuity" ? (
                    <select
                      value={prescriptionValues[eye][field] || ""}
                      onChange={(e) =>
                        handleInputChange(eye, field, e.target.value)
                      }
                      className="w-24 px-2 py-1 border rounded"
                    >
                      <option value="">--</option>
                      {(field === "Base"
                        ? baseOptions
                        : visualAcuityOptions || []
                      ).map((opt) => (
                        <option
                          key={opt.value || opt.Id}
                          value={opt.value || opt.Id}
                        >
                          {opt.label || opt.VisualAcuity}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      step={field === "Axis" ? 1 : 0.25}
                      min={
                        field === "Axis" ? 1 : field === "ADD" ? 0 : undefined
                      }
                      max={field === "Axis" ? 180 : undefined}
                      value={prescriptionValues[eye][field]}
                      onChange={(e) =>
                        handleInputChange(eye, field, e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Remarks */}
      <Input
        label="Remarks *"
        name="remarks"
        value={prescriptionData.remarks}
        onChange={(e) => handleDataChange("remarks", e.target.value)}
        className="w-1/2"
      />

      {/* Errors */}
      {liveErrors.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 text-sm text-yellow-700 rounded space-y-1">
          {liveErrors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end mt-4">
        {isPrescription ? (
          <HasPermission module="Prescription" action={["edit","create"]}>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || isUpdating}
              isLoading={isSaving || isUpdating}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                ? "Update Prescription"
                : "Save Prescription"}
            </Button>
          </HasPermission>
        ) : (
          // <HasPermission>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || isUpdating}
              isLoading={isSaving || isUpdating}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                ? "Update Prescription"
                : "Save Prescription"}
            </Button>
          // </HasPermission>
        )}
      </div>

      {/* Showing the power details */}
      {isPrescription && allPrescriptionData?.length > 0 && (
        <div className="space-y-6">
          {/* Prescriptions Table */}
          <div className="">
            <Table
              columns={["Prescription Date", "Remarks", "Actions"]}
              headerClassName="bg-gray-50 text-gray-700 font-medium"
              data={allPrescriptionData}
              renderRow={(p, index) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell className="">
                    <div className="flex items-center text-gray-900">
                      <FiCalendar className="mr-2 text-gray-400" />
                      {p.PrescriptionDate}
                    </div>
                  </TableCell>
                  <TableCell className="">
                    <div className="flex items-center text-gray-600">
                      <FiFileText className="mr-2 text-gray-400" />
                      {p.Remarks}
                    </div>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => handleView(p)}
                    >
                      <FiEye className="mr-1.5" />
                      View
                    </button>
                    <HasPermission module="Prescription" action={["edit"]}>
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={() => handleUpdate(p)}
                    >
                      <FiEdit className="mr-1.5" />
                      Update
                    </button>
                    </HasPermission>
                    <HasPermission module="Prescription" action="deactivate">
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => handleDelete(p)}
                      aria-label="Delete"
                    >
                      <FiTrash2 className="mr-1.5" />
                      Delete
                    </button>
                    </HasPermission>
                  </TableCell>
                </TableRow>
              )}
            />
          </div>

          {/* Prescription Details Modal */}
          {selectedPrescription && (
            <Modal
              isOpen={selectedPrescription}
              onClose={() => setSelectedPrescription(null)}
              width="max-w-4xl"
            >
              <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FiClipboard className="mr-2 text-blue-500" />
                    Prescription Details
                  </h2>
                </div>

                <div className="p-6">
                  {/* Metadata Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start">
                      <FiCalendar className="mt-1 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">
                          Prescription Date
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.PrescriptionDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiFileText className="mt-1 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Remarks</p>
                        <p className="font-medium">
                          {selectedPrescription.Remarks || "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiUser className="mt-1 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Sales Person</p>
                        <p className="font-medium">
                          {salesPersons?.data?.data.find(
                            (s) => s.Id === selectedPrescription.SalesPersonId
                          )?.PersonName || "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiClipboard className="mt-1 mr-3 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">
                          Prescription From
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.PrescriptionFrom === 0
                            ? "Tested at store"
                            : "From Doctor"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Power Details Section */}
                  <div>
                    <h3 className="text-md font-semibold mb-4 text-gray-800 flex items-center">
                      <FiEye className="mr-2 text-blue-500" />
                      Power Details
                    </h3>
                    <div className="overflow-x-auto shadow-sm rounded-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {[
                              "Side",
                              "SPH",
                              "CYL",
                              "Axis",
                              "ADD",
                              "Prism",
                              "Base",
                              "Acuity",
                            ].map((item) => (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {item}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {["R", "L"].map((side) => (
                            <tr key={side}>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {side}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]?.SPH ??
                                  "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]?.CYL ??
                                  "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]?.Axis ??
                                  "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]?.ADD ??
                                  "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]?.Prism ??
                                  "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]?.Base ??
                                  "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedPrescription.values?.[side]
                                  ?.VisualAcuity ?? "--"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
};

export default NewPrescription;
