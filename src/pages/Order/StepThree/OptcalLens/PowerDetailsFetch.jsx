import React, { useState, useEffect } from "react";
import Radio from "../../../../components/Form/Radio";
import Button from "../../../../components/ui/Button";
import {
  useGetDIaDetailsMutation,
  useGetIdentifierQuery,
  useGetPriceMutation,
  useSaveOpticalLensMutation,
  useUpdateIdentifierMutation,
} from "../../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import { useGetAllRimTypeQuery } from "../../../../api/materialMaster";
import { Autocomplete, TextField } from "@mui/material";
import { useOrder } from "../../../../features/OrderContext";

const inputTableColumns = ["SPH", "CYLD", "Axis", "ADD", "Dia", "Details"];

const PowerDetailsFetch = ({
  lensData,
  setLensData,
  prescriptionData,
  focalityData,
  items = [],
  customerId,
  handleSaveOpticalLens,
  goToStep,
  selectedProduct,
  savedOrders,
}) => {
  const { Identifiers } = useOrder();
  console.log("Ident", Identifiers);
  const selectedFocality = focalityData?.find(
    (f) => f.OpticalLensFocality.Id === lensData.focality
  )?.OpticalLensFocality?.Add_Value;

  const [selectedEyes, setSelectedEyes] = useState([]);
  const [isEditable, setIsEditable] = useState(false);
  const [formValues, setFormValues] = useState({
    R: {
      Dia: null,
      converted: {},
      OpticalLensDetailsId: [],
      SellingPrice: "",
      AvailableQty: 0,
    },
    L: {
      Dia: null,
      converted: {},
      OpticalLensDetailsId: [],
      SellingPrice: "",
      AvailableQty: 0,
    },
  });
  const [diaOptions, setDiaOptions] = useState([]);
  const [addFieldError, setAddFieldError] = useState(false);
  const [totalSellingPrice, setTotalSellingPrice] = useState(null);
  const [showGetPriceButton, setShowGetPriceButton] = useState(false);
  const [showGetDiaButton, setShowGetDiaButton] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDiaDiffModal, setShowDiaDiffModal] = useState(false);
  const [pendingPricePayload, setPendingPricePayload] = useState(null);
  const [isDiaFetched, setIsDiaFetched] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningIssues, setWarningIssues] = useState([]);
  const [isPriceFetched, setIsPriceFetched] = useState(false);

  const [updateIdentifier, { isLoading: isIdentfierSubmitting }] =
    useUpdateIdentifierMutation();
  const [getDIADetails, { isLoading: isDiaLoading }] =
    useGetDIaDetailsMutation();
  const { data: rimTypes } = useGetAllRimTypeQuery();
  const [getPrice, { isLoading: isPriceLoading }] = useGetPriceMutation();
  const [saveOpticalLens, { isLoading: isOlSaving }] =
    useSaveOpticalLensMutation();

  useEffect(() => {
    if (prescriptionData) {
      const latest = prescriptionData;
      setFormValues({
        R: {
          SPH: latest.RSPH || "",
          CYLD: latest.RCYD || "",
          Axis: latest.RAxis || "",
          ADD: latest.RAddOn || "",
          Dia: null,
          converted: {},
          OpticalLensDetailsId: [],
          SellingPrice: "",
          AvailableQty: 0,
        },
        L: {
          SPH: latest.LSPH || "",
          CYLD: latest.LCYD || "",
          Axis: latest.LAxis || "",
          ADD: latest.LAddOn || "",
          Dia: null,
          converted: {},
          OpticalLensDetailsId: [],
          SellingPrice: "",
          AvailableQty: 0,
        },
      });
      setIsDiaFetched(false);
    }
  }, [prescriptionData]);

  useEffect(() => {
    if (selectedFocality === 0) {
      const hasAddValue =
        formValues.R?.ADD?.trim() || formValues.L?.ADD?.trim();
      setAddFieldError(!!hasAddValue);
    } else {
      setAddFieldError(false);
    }
  }, [formValues, selectedFocality]);

  useEffect(() => {
    const isBothSelected = lensData.powerSingleORboth === 1;
    if (isBothSelected) {
      setShowGetPriceButton(
        formValues.R.Dia && formValues.L.Dia && isDiaFetched
      );
    } else {
      const selectedEye = selectedEyes[0];
      setShowGetPriceButton(
        selectedEye && formValues[selectedEye].Dia && isDiaFetched
      );
    }
  }, [formValues, selectedEyes, lensData.powerSingleORboth, isDiaFetched]);

  const handleCheckboxChange = (eye) => {
    if (lensData.powerSingleORboth === 0) {
      setSelectedEyes([eye]);
    }
  };

  const handleEdit = () => setIsEditable(true);

  const handleReset = () => {
    setSelectedEyes([]);
    setIsEditable(false);
    setFormValues({
      R: {
        Dia: null,
        converted: {},
        OpticalLensDetailsId: [],
        SellingPrice: "",
        AvailableQty: 0,
      },
      L: {
        Dia: null,
        converted: {},
        OpticalLensDetailsId: [],
        SellingPrice: "",
        AvailableQty: 0,
      },
    });
    setLensData((prev) => ({
      ...prev,
      powerSingleORboth: 0,
      prescriptionId: null,
      rimType: null,
      withFitting: 1,
    }));
    setAddFieldError(false);
    setTotalSellingPrice(null);
    setShowGetPriceButton(false);
    setShowGetDiaButton(true);
    setShowConfirmModal(false);
    setShowDiaDiffModal(false);
    setIsDiaFetched(false);
    setDiaOptions([]);
    setWarningMessage("");
    setWarningIssues([]);
    setIsPriceFetched(false);
  };

  const handleInputChange = (eye, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [eye]: { ...prev[eye], [field]: value },
    }));
  };

  const isFieldDisabled = (eye, field) => {
    if (field === "Dia") {
      return (
        isPriceFetched ||
        !isEditable ||
        (lensData.powerSingleORboth !== 1 && !selectedEyes.includes(eye))
      );
    }
    return (
      isDiaFetched ||
      (field === "ADD" && selectedFocality === 0) ||
      !isEditable ||
      (lensData.powerSingleORboth !== 1 && !selectedEyes.includes(eye))
    );
  };

  const handleGetDia = async () => {
    const isBothSelected = lensData.powerSingleORboth === 1;
    const isRSelected = isBothSelected || selectedEyes.includes("R");
    const isLSelected = isBothSelected || selectedEyes.includes("L");

    const safeParse = (value) => {
      const parsed = typeof value === "string" ? value.trim() : value;
      return parsed !== "" && !isNaN(parsed) ? Number(parsed) : null;
    };

    const payload = {
      RSPH: isRSelected ? safeParse(formValues.R.SPH) : null,
      RCYLD: isRSelected ? safeParse(formValues.R.CYLD) : null,
      RAXIS: isRSelected ? safeParse(formValues.R.Axis) : null,
      RADD: isRSelected ? safeParse(formValues.R.ADD) : null,
      selectedTypeRight: isRSelected ? 1 : 0,
      LSPH: isLSelected ? safeParse(formValues.L.SPH) : null,
      LCYLD: isLSelected ? safeParse(formValues.L.CYLD) : null,
      LAXIS: isLSelected ? safeParse(formValues.L.Axis) : null,
      LADD: isLSelected ? safeParse(formValues.L.ADD) : null,
      selectedTypeLeft: isLSelected ? 1 : 0,
      OpticalLensMasterId: lensData.masterId,
      CoatingComboId: lensData.coatingComboId,
    };

    try {
      const res = await getDIADetails({ payload }).unwrap();
      const { converted, diameters, details } = res.data || {};

      if (res.status === "failure" || res.success === false) {
        const errors = res.error || res.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            toast.error(` ${err.message}`);
          });
        } else if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Failed to fetch Dia details");
        }
        return;
      }

      const updatedForm = { ...formValues };
      let hasDetails = false;
      ["R", "L"].forEach((eye) => {
        if ((eye === "R" && isRSelected) || (eye === "L" && isLSelected)) {
          updatedForm[eye].converted = converted?.[eye] || {};
          const dia = diameters?.find((d) => d.side === eye);
          updatedForm[eye].Dia = dia || null;
          const eyeDetails =
            details
              ?.filter((d) => d.side === eye)
              .map((d) => d.OpticalLensDetailsId.toString()) || [];
          updatedForm[eye].OpticalLensDetailsId = eyeDetails;
          updatedForm[eye].SellingPrice = "";
          updatedForm[eye].AvailableQty = 0;
          if (eyeDetails.length > 0) hasDetails = true;
        }
      });
      setFormValues(updatedForm);
      setDiaOptions(diameters || []);
      setIsDiaFetched(true);
      setShowGetDiaButton(false);
    } catch (err) {
      console.error("Error fetching Dia:", err);
      const errors = err.data?.error || err.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((error) => {
          toast.error(`${error.message}`);
        });
      } else if (typeof errors === "string") {
        toast.error(errors);
      } else {
        toast.error("Failed to fetch Dia details");
      }
    }
  };

  const handleGetPrice = async (bypass = false) => {
    const isBothSelected = lensData.powerSingleORboth === 1;
    const isRSelected = isBothSelected || selectedEyes.includes("R");
    const isLSelected = isBothSelected || selectedEyes.includes("L");

    const safeParse = (value) => {
      const parsed = typeof value === "string" ? value.trim() : value;
      return parsed !== "" && !isNaN(parsed) ? Number(parsed) : null;
    };

    const powers = {};
    ["R", "L"].forEach((eye) => {
      if ((eye === "R" && isRSelected) || (eye === "L" && isLSelected)) {
        const firstDetailId = formValues[eye].OpticalLensDetailsId[0] || null;
        if (firstDetailId) {
          powers[eye] = {
            sph: safeParse(formValues[eye].SPH) || 0,
            cyld: safeParse(formValues[eye].CYLD) || 0,
            axis: safeParse(formValues[eye].Axis) || 0,
            add: safeParse(formValues[eye].ADD) || undefined,
            OpticalLensDetailsId: parseInt(firstDetailId),
          };
        }
      }
    });

    const payload = {
      coatingComboId: lensData.coatingComboId,
      locationId: customerId.locationId,
      selectionType: isBothSelected ? "Both" : "Single",
      bypass,
      powers,
      tintPrice: !isBothSelected
        ? parseFloat(lensData.tintPrice) / 2
        : parseFloat(lensData.tintPrice) || null,
      addonPrice: !isBothSelected
        ? parseInt(lensData.AddOnData[0]?.price.substring(1)) / 2
        : parseInt(lensData.AddOnData[0]?.price.substring(1)) || null,
    };

    try {
      const res = await getPrice({ payload }).unwrap();
      const { totalSellingPrice, details, warning, message, issues } =
        res.data || {};

      if (res.status === "failure" || res.success === false) {
        const errors = res.error || res.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            toast.error(`${err.message}`);
          });
        } else if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Failed to fetch price details");
        }
        return;
      }

      if (warning && !bypass) {
        setWarningMessage(
          message || "An issue occurred. Do you want to proceed?"
        );
        setWarningIssues(issues || []);
        setPendingPricePayload(payload);
        if (message.includes("Dia is selected")) {
          setShowDiaDiffModal(true);
        } else {
          setShowConfirmModal(true);
        }
        return;
      }

      const updatedForm = { ...formValues };
      ["R", "L"].forEach((eye) => {
        if ((eye === "R" && isRSelected) || (eye === "L" && isLSelected)) {
          updatedForm[eye].SellingPrice =
            details?.[eye]?.SellingPrice?.toString() || "";
          updatedForm[eye].AvailableQty =
            details?.[eye]?.AvailableQty?.toString() || "0";
        }
      });
      setFormValues(updatedForm);
      setTotalSellingPrice(totalSellingPrice || null);
      setShowConfirmModal(false);
      setShowDiaDiffModal(false);
      setShowGetPriceButton(false);
      setIsPriceFetched(true);
      setWarningMessage("");
      setWarningIssues([]);
    } catch (err) {
      console.error("Error fetching Price:", err);
      const errors = err.data?.error || err.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((error) => {
          toast.error(` ${error.message}`);
        });
      } else if (typeof errors === "string") {
        toast.error(errors);
      } else {
        toast.error("Failed to fetch price details");
      }
    }
  };

  const handleConfirmBypassWarnings = () => {
    if (pendingPricePayload) {
      handleGetPrice(true);
    }
    setShowConfirmModal(false);
  };

  const handleConfirmDiaDiff = () => {
    if (pendingPricePayload) {
      handleGetPrice(true);
    }
    setShowDiaDiffModal(false);
  };

  const handleSave = async () => {
    if (!lensData.rimType) {
      toast.error("Please select Frame Rim Type!");
      return;
    }
    const isBothSelected = lensData.powerSingleORboth === 1;
    const isRSelected = isBothSelected || selectedEyes.includes("R");
    const isLSelected = isBothSelected || selectedEyes.includes("L");
    const safeParse = (value) => {
      const parsed = typeof value === "string" ? value.trim() : value;
      return parsed !== "" && !isNaN(parsed) ? Number(parsed) : null;
    };

    const payload = {
      OrderReference: lensData.orderReference,
      patientId: customerId.patientId,
      MasterId: lensData.masterId,
      withFitting: lensData.withFitting,
      frameType: lensData.rimType,
      rightPower: {
        sph: isRSelected ? safeParse(formValues.R.SPH) : null,
        cyld: isRSelected ? safeParse(formValues.R.CYLD) : null,
        axis: isRSelected ? safeParse(formValues.R.Axis) : null,
        add: isRSelected ? safeParse(formValues.R.ADD) : null,
        dia: isRSelected ? formValues.R.Dia?.Id : null,
      },
      leftPower: {
        sph: isLSelected ? safeParse(formValues.L.SPH) : null,
        cyld: isLSelected ? safeParse(formValues.L.CYLD) : null,
        axis: isLSelected ? safeParse(formValues.L.Axis) : null,
        add: isLSelected ? safeParse(formValues.L.ADD) : null,
        dia: isLSelected ? formValues.L.Dia?.Id : null,
      },
      tint: lensData.tintvalue === 1 ? true : false,
      tintId: lensData.tintId,
      tintPrice: parseFloat(lensData.tintPrice),
      addOn: lensData.AddOnData.length > 0 ? true : false,
      addonList: lensData.AddOnData?.map((a) => {
        return {
          addOnId: a.Id,
          addOnPrice: parseFloat(a.price.substring(1)),
        };
      }),
      actualSellingPrice: parseFloat(totalSellingPrice),
      discountedSellingPrice: parseFloat(totalSellingPrice),
      olDetailId: [
        parseInt(formValues[isBothSelected ? "R" : ""].OpticalLensDetailsId[0]),
        parseInt(formValues[isBothSelected ? "L" : ""].OpticalLensDetailsId[0]),
      ],
      index: lensData.indexValues,
      companyId: customerId.companyId,
    };
    if (selectedProduct.value === 6) {
      payload.identifier = Identifiers?.identifier || null;
    }
    try {
      if (selectedProduct.value === 6) {
        await updateIdentifier({
          id: savedOrders?.OrderDetailId,
          payload: { Identifier: Identifiers.identifier },
        });
      }
      await saveOpticalLens({ orderId: customerId.orderId, payload }).unwrap();
      toast.success("Optical Lens got saved successfully");
      goToStep(4);
    } catch (error) {
      console.log(error);
      toast.error("Optical Lens are not saving");
    }
  };

  const renderConvertedNote = (eye, field) => {
    const c = formValues[eye].converted;
    if (!c || Object.keys(c).length === 0) return null;

    const fieldValue = formValues[eye][field];
    const convertedValue = c[field.toLowerCase()];

    if (
      fieldValue !== undefined &&
      fieldValue !== "" &&
      convertedValue !== undefined &&
      Number(fieldValue) !== Number(convertedValue)
    ) {
      return (
        <p className="text-xs mt-0.5 leading-tight w-24">
          Converted: {convertedValue}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow-sm p-4 mt-5 rounded-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Radio
            label="Single"
            value="0"
            name="powerSingleORboth"
            onChange={() => {
              setLensData((prev) => ({ ...prev, powerSingleORboth: 0 }));
              setSelectedEyes([]);
            }}
            checked={lensData.powerSingleORboth == 0}
          />
          <Radio
            label="Both"
            value="1"
            name="powerSingleORboth"
            onChange={() => {
              setLensData((prev) => ({ ...prev, powerSingleORboth: 1 }));
              setSelectedEyes(["R", "L"]);
            }}
            checked={lensData.powerSingleORboth == 1}
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleEdit}>
            Edit
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>
      {addFieldError && (
        <p className="text-red-600 mt-2 text-sm">
          Add on value is not applicable for the selected product. Please change
          the product or the prescription
        </p>
      )}
      <table className="w-full bg-white shadow rounded-lg mt-3 border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-gray-600 font-medium">Eye</th>
            {inputTableColumns.map((col) => (
              <th
                key={col}
                className="p-3 text-left text-gray-600 font-medium uppercase"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["R", "L"].map((eye) => (
            <tr key={eye} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-700 flex items-center gap-2">
                {eye}
                <input
                  type="checkbox"
                  checked={
                    lensData.powerSingleORboth === 1 ||
                    selectedEyes.includes(eye)
                  }
                  onChange={() => handleCheckboxChange(eye)}
                  disabled={lensData.powerSingleORboth === 1}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </td>
              {inputTableColumns.map((field) => (
                <td key={field} className="p-3 align-top">
                  {field === "Dia" && isDiaFetched ? (
                    <select
                      className={`w-24 px-2 py-1 border rounded-md ${
                        isFieldDisabled(eye, field)
                          ? "bg-gray-100 border-gray-200 text-gray-400"
                          : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      value={formValues[eye].Dia?.DiameterSize || ""}
                      onChange={(e) => {
                        const selectedDia = diaOptions.find(
                          (d) =>
                            d.side === eye && d.DiameterSize === e.target.value
                        );
                        handleInputChange(eye, "Dia", selectedDia || null);
                      }}
                      disabled={isFieldDisabled(eye, field)}
                    >
                      <option value="">Select</option>
                      {diaOptions
                        .filter((d) => d.side === eye)
                        .map((d) => (
                          <option key={d.Id} value={d.DiameterSize}>
                            {d.DiameterSize}
                          </option>
                        ))}
                    </select>
                  ) : field === "Details" && isPriceFetched ? (
                    <input
                      type="text"
                      value={`Selling Price: ${formValues[eye].SellingPrice}\n Qty: ${formValues[eye].AvailableQty}`}
                      readOnly
                      className="px-2 py-1 border rounded-md bg-gray-100 border-gray-200 text-gray-400"
                      disabled
                    />
                  ) : field !== "Dia" && field !== "Details" ? (
                    <div>
                      <input
                        type="text"
                        value={formValues[eye][field] || ""}
                        onChange={(e) =>
                          handleInputChange(eye, field, e.target.value)
                        }
                        className={`w-24 px-2 py-1 border rounded-md ${
                          isFieldDisabled(eye, field)
                            ? "bg-gray-100 border-gray-200 text-gray-400"
                            : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        disabled={isFieldDisabled(eye, field)}
                      />
                      {(field === "CYLD" ||
                        field === "Axis" ||
                        field === "SPH") &&
                        renderConvertedNote(eye, field)}
                    </div>
                  ) : (
                    <div className="w-24"></div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end gap-4 items-center">
        {showGetDiaButton && (
          <Button onClick={handleGetDia} disabled={isDiaLoading}>
            {isDiaLoading ? "Loading..." : "Get Dia"}
          </Button>
        )}
        {showGetPriceButton && !isPriceFetched && (
          <Button
            onClick={() => handleGetPrice(false)}
            disabled={isPriceLoading}
          >
            {isPriceLoading ? "Loading..." : "Get Price"}
          </Button>
        )}
      </div>
      <div className="mt-5 flex justify-between">
        <div className="flex gap-3 items-center">
          <div className="text-xl text-neutral-700 font-normal">
            With Fitting *
          </div>
          <Radio
            label="Yes"
            value="1"
            name="withFitting"
            onChange={() =>
              setLensData((prev) => ({ ...prev, withFitting: 1 }))
            }
            checked={lensData.withFitting === 1}
          />
          <Radio
            label="No"
            value="0"
            name="withFitting"
            onChange={() =>
              setLensData((prev) => ({
                ...prev,
                withFitting: 0,
                rimType: null,
              }))
            }
            checked={lensData.withFitting === 0}
          />
        </div>
        {lensData.withFitting === 1 && (
          <div className="w-1/3">
            <div className="">
              <label className="text-sm font-medium text-gray-700">
                Select Frame Type
              </label>
              <Autocomplete
                options={rimTypes?.data}
                getOptionLabel={(option) => option.FrameRimTypeName}
                value={
                  rimTypes?.data?.find(
                    (brand) => brand.Id === lensData.rimType
                  ) || null
                }
                onChange={(_, newValue) =>
                  setLensData((prev) => ({
                    ...prev,
                    rimType: newValue?.Id || null,
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Frame Type"
                    size="small"
                  />
                )}
                fullWidth
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-4 items-center">
        {isPriceFetched && (
          <>
            <p className="text-sm text-gray-700">
              Total Selling Price: {totalSellingPrice}
            </p>
            <Button
              isLoading={isOlSaving || isIdentfierSubmitting}
              disabled={isOlSaving || isIdentfierSubmitting}
              onClick={handleSave}
            >
              Save & Next
            </Button>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBypassWarnings}
        title="Power Warning"
        message={
          <div>
            <p>{warningMessage}</p>
            {warningIssues.length > 0 && (
              <ul className="list-disc pl-5 mt-2">
                {warningIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        }
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isPriceLoading}
      />

      <ConfirmationModal
        isOpen={showDiaDiffModal}
        onClose={() => setShowDiaDiffModal(false)}
        onConfirm={handleConfirmDiaDiff}
        title="Different Dia Selection"
        message={
          warningMessage ||
          "2 different Dia is selected. Are you sure you want to continue?"
        }
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        danger={false}
        isLoading={isPriceLoading}
      />
    </div>
  );
};

export default PowerDetailsFetch;
