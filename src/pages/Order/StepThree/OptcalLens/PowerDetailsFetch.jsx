import React, { useState, useEffect } from "react";
import Radio from "../../../../components/Form/Radio";
import Button from "../../../../components/ui/Button";
import {
  useGetDIaDetailsMutation,
  useGetPriceMutation,
} from "../../../../api/orderApi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";

const inputTableColumns = ["SPH", "CYLD", "Axis", "ADD", "Dia", "Details"];

const PowerDetailsFetch = ({
  lensData,
  setLensData,
  prescriptionData,
  focalityData,
  items = [], // Default to empty array if items not passed
  customerId,
}) => {
  const selectedFocality = focalityData?.find(
    (f) => f.OpticalLensFocality.Id === lensData.focality
  )?.OpticalLensFocality?.Add_Value;

  const [selectedEyes, setSelectedEyes] = useState([]);
  const [isEditable, setIsEditable] = useState(false);
  const [formValues, setFormValues] = useState({
    R: { Dia: "", converted: {}, OpticalLensDetailsId: [], SellingPrice: "" },
    L: { Dia: "", converted: {}, OpticalLensDetailsId: [], SellingPrice: "" },
  });
  const [diaOptions, setDiaOptions] = useState([]);
  const [addFieldError, setAddFieldError] = useState(false);
  const [totalSellingPrice, setTotalSellingPrice] = useState(null);
  const [showGetPriceButton, setShowGetPriceButton] = useState(false);
  const [showGetDiaButton, setShowGetDiaButton] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warningPayload, setWarningPayload] = useState([]);
  const [pendingPricePayload, setPendingPricePayload] = useState(null);

  const [getDIADetails, { isLoading: isDiaLoading }] =
    useGetDIaDetailsMutation();
  const [getPrice, { isLoading: isPriceLoading }] = useGetPriceMutation();

  useEffect(() => {
    if (prescriptionData) {
      const latest = prescriptionData;
      setFormValues({
        R: {
          SPH: latest.RSPH || "",
          CYLD: latest.RCYD || "",
          Axis: latest.RAxis || "",
          ADD: latest.RAddOn || "",
          Dia: "",
          converted: {},
          OpticalLensDetailsId: [],
          SellingPrice: "",
        },
        L: {
          SPH: latest.LSPH || "",
          CYLD: latest.LCYD || "",
          Axis: latest.LAxis || "",
          ADD: latest.LAddOn || "",
          Dia: "",
          converted: {},
          OpticalLensDetailsId: [],
          SellingPrice: "",
        },
      });
    }
  }, [prescriptionData]);

  useEffect(() => {
    if (selectedFocality === 0) {
      const hasAddValue = formValues.R.ADD?.trim() || formValues.L.ADD?.trim();
      setAddFieldError(!!hasAddValue);
    } else {
      setAddFieldError(false);
    }
  }, [formValues, selectedFocality]);

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
      R: { Dia: "", converted: {}, OpticalLensDetailsId: [], SellingPrice: "" },
      L: { Dia: "", converted: {}, OpticalLensDetailsId: [], SellingPrice: "" },
    });
    setLensData((prev) => ({
      ...prev,
      powerSingleORboth: 0,
      prescriptionId: null,
    }));
    setAddFieldError(false);
    setTotalSellingPrice(null);
    setShowGetPriceButton(false);
    setShowGetDiaButton(true);
    setShowConfirmModal(false);
    setWarningPayload([]);
  };

  const handleInputChange = (eye, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [eye]: { ...prev[eye], [field]: value },
    }));
  };

  const isFieldDisabled = (eye, field) => {
    const disabled =
      (field === "ADD" && selectedFocality === 0) ||
      !isEditable ||
      (lensData.powerSingleORboth !== 1 && !selectedEyes.includes(eye));
    console.log(`Field ${field} for ${eye} disabled:`, disabled); // Debug
    return disabled;
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
      console.log("Get Dia API response:", res); // Debug
      const { converted, diameters, details } = res.data || {};

      if (res.status === "failure" && res.error) {
        res.error.forEach((err) => {
          toast.error(`${err.side}: ${err.message}`);
        });
        return;
      }

      const updatedForm = { ...formValues };
      let hasDetails = false;
      ["R", "L"].forEach((eye) => {
        if ((eye === "R" && isRSelected) || (eye === "L" && isLSelected)) {
          updatedForm[eye].converted = converted?.[eye] || {};
          const dia = diameters?.find((d) => d.side === eye);
          updatedForm[eye].Dia = dia?.DiameterSize || "";
          const eyeDetails =
            details
              ?.filter((d) => d.side === eye)
              .map((d) => d.OpticalLensDetailsId.toString()) || [];
          updatedForm[eye].OpticalLensDetailsId = eyeDetails;
          updatedForm[eye].SellingPrice = "";
          if (eyeDetails.length > 0) hasDetails = true;
          console.log(`Updated ${eye}:`, updatedForm[eye]); // Debug
        }
      });
      setFormValues(updatedForm);
      console.log("Updated formValues:", updatedForm); // Debug
      setDiaOptions(diameters || []);
      console.log("DiaOptions set:", diameters); // Debug
      setShowGetPriceButton(hasDetails);
      setShowGetDiaButton(false);
    } catch (err) {
      console.error("Error fetching Dia:", err);
      if (err.data?.status === "failure" && err.data.error) {
        err.data.error.forEach((error) => {
          toast.error(`${error.side}: ${error.message}`);
        });
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
      tintPrice: 1000,
      addonPrice: 500,
    };

    try {
      const res = await getPrice({ payload }).unwrap();
      const { totalSellingPrice, details, warning } = res.data || {};

      if (res.status === "failure" && res.error) {
        res.error.forEach((err) => {
          toast.error(`${err.side}: ${err.message}`);
        });
        return;
      }

      // Check for stock warnings based on AvailableQty
      const warnings = [];
      ["R", "L"].forEach((eye) => {
        if (details?.[eye]?.AvailableQty === 0) {
          warnings.push({
            frameDetailId: details[eye].OpticalLensDetailId,
            message: `Lens for ${eye} is out of stock`,
          });
        }
      });

      if (warnings.length > 0 && !bypass) {
        setWarningPayload(warnings);
        setPendingPricePayload(payload);
        setShowConfirmModal(true);
        return;
      }

      const updatedForm = { ...formValues };
      ["R", "L"].forEach((eye) => {
        if ((eye === "R" && isRSelected) || (eye === "L" && isLSelected)) {
          updatedForm[eye].SellingPrice =
            details?.[eye]?.SellingPrice?.toString() || "";
        }
      });
      setFormValues(updatedForm);
      console.log("Updated formValues after Get Price:", updatedForm);
      setTotalSellingPrice(totalSellingPrice || null);
      setShowConfirmModal(false);
      setWarningPayload([]);
    } catch (err) {
      console.log(err);
    }
  };

  const handleConfirmBypassWarnings = () => {
    if (pendingPricePayload) {
      handleGetPrice(true);
    }
    setShowConfirmModal(false);
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
        <p className="text-xs  mt-0.5 leading-tight w-24">
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
            checked={lensData.powerSingleORboth === 0}
          />
          <Radio
            label="Both"
            value="1"
            name="powerSingleORboth"
            onChange={() => {
              setLensData((prev) => ({ ...prev, powerSingleORboth: 1 }));
              setSelectedEyes(["R", "L"]);
            }}
            checked={lensData.powerSingleORboth === 1}
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleEdit}>
            Edit
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>

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
                  {field === "Dia" ? (
                    <select
                      className={`w-24 px-2 py-1 border rounded-md ${
                        isFieldDisabled(eye, field)
                          ? "bg-gray-100 border-gray-200 text-gray-400"
                          : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      value={formValues[eye].Dia || ""}
                      onChange={(e) =>
                        handleInputChange(eye, "Dia", e.target.value)
                      }
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
                  ) : field === "Details" ? (
                    <input
                      type="text"
                      value={formValues[eye].SellingPrice || ""}
                      readOnly
                      className="w-24 px-2 py-1 border rounded-md bg-gray-100 border-gray-200 text-gray-400"
                      disabled
                    />
                  ) : (
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
                      {(field === "CYLD" || field === "Axis" || field === "SPH") &&
                        renderConvertedNote(eye, field)}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end gap-4">
        {showGetDiaButton && (
          <Button onClick={handleGetDia} disabled={isDiaLoading}>
            {isDiaLoading ? "Loading..." : "Get Dia"}
          </Button>
        )}
        {showGetPriceButton && (
          <Button
            onClick={() => handleGetPrice(false)}
            disabled={isPriceLoading}
          >
            {isPriceLoading ? "Loading..." : "Get Price"}
          </Button>
        )}
      </div>

      {totalSellingPrice !== null && (
        <p className="mt-2 text-sm text-gray-700">
          Total Selling Price: {totalSellingPrice}
        </p>
      )}

      {addFieldError && (
        <p className="text-red-600 mt-2 text-sm">
          The "ADD" field must be empty when the selected focality is 0.
        </p>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBypassWarnings}
        title="Lens Warning"
        message={
          warningPayload && warningPayload.length > 0 ? (
            <>
              <p className="mb-2"></p>
              <ul className="list-disc pl-5">
                {warningPayload.map((warning, idx) => {
                  const indexInItems =
                    items.findIndex(
                      (item) => item.Id === warning.frameDetailId
                    ) + 1;
                  return (
                    <li key={warning.frameDetailId}>
                      OpticalLens #{indexInItems}: {warning.message}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2">Do you want to proceed anyway?</p>
            </>
          ) : (
            "Some Optical Lens are not available. Do you want to proceed anyway?"
          )
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
