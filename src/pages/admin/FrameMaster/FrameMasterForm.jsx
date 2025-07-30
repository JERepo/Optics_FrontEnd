import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useFrameMaster } from "../../../features/frameMasterContext";
import Input from "../../../components/Form/Input";
import Radio from "../../../components/Form/Radio";

const FrameMasterForm = forwardRef(
  (
    {
      initialValues = {},
      brands = [],
      rimTypes = [],
      rimShapes = [],
      materials = [],
      taxOptions = [],
      isEnabled,
      isEditMode,
    },
    ref
  ) => {
    const { formData, setFormData } = useFrameMaster();
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      const val = type === "checkbox" ? checked : value;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (val !== "") {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };

    const validate = () => {
      const newErrors = {};

      if (!formData.BrandID) newErrors.BrandID = "Brand is required.";

      if (!formData.ModelNo) {
        newErrors.ModelNo = "Model No is required.";
      } else if (formData.ModelNo.length > 30) {
        newErrors.ModelNo = "Model No cannot exceed 30 characters";
      }
      if (formData.IsClipOn) {
        if (!formData.NoOfClips) {
          newErrors.NoOfClips = "No Of Clips is Required!";
        } else if (isNaN(formData.NoOfClips)) {
          newErrors.NoOfClips = "No Of Clips is not a number!";
        } else if (formData.NoOfClips.length > 1) {
          newErrors.NoOfClips = "No Of Clips must be in between 0 - 9";
        } else if (Number(formData.NoOfClips) < 0) {
          newErrors.NoOfClips = "No Of Clips should be a positive Number";
        }
      }

      if (!formData.Category) newErrors.Category = "Category is required.";
      if (!formData.Type) newErrors.Type = "Rim Type is required.";

      if (!formData.HSN) {
        newErrors.HSN = "HSN Code is required.";
      } else if (formData.HSN.length > 6) {
        newErrors.HSN = "HSN Code cannot exceed 6 characters";
      }

      if (!formData.TaxID) newErrors.TaxID = "Tax is required.";

      setErrors(newErrors);
      return newErrors;
    };

    // Expose the validate function to the parent component
    useImperativeHandle(ref, () => ({
      validate,
    }));

    return (
      <form className="space-y-6 p-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label>Brand *</label>
            <select
              name="BrandID"
              value={formData.BrandID}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <>
                  {b.IsActive === 1 && b.FrameActive === 1 && (
                    <option key={b.Id} value={b.Id}>
                      {b.BrandName}
                    </option>
                  )}
                </>
              ))}
            </select>
            {errors.BrandID && (
              <p className="text-red-500 text-sm">{errors.BrandID}</p>
            )}
          </div>

          <div>
            <label>Model No *</label>
            <input
              type="text"
              name="ModelNo"
              value={formData.ModelNo}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            />
            {errors.ModelNo && (
              <p className="text-red-500 text-sm">{errors.ModelNo}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="">
            <label>Rim Type *</label>
            <select
              name="Type"
              value={formData.Type}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Rim Type</option>
              {rimTypes.map((t) => (
                <>
                  {t.IsActive === 1 && (
                    <option key={t.Id} value={t.Id}>
                      {t.FrameRimTypeName}
                    </option>
                  )}
                </>
              ))}
            </select>
            {errors.Type && (
              <p className="text-red-500 text-sm">{errors.Type}</p>
            )}
          </div>

          <div>
            <label>Rim Shape</label>
            <select
              name="ShapeID"
              value={formData.ShapeID}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Rim Shape</option>
              {rimShapes.map((s) => (
                <>
                  {s.IsActive === 1 && (
                    <option key={s.Id} value={s.Id}>
                      {s.ShapeName}
                    </option>
                  )}
                </>
              ))}
            </select>
          </div>
          <div>
            <label>Temple Material</label>
            <select
              name="TempleMaterialID"
              value={formData.TempleMaterialID}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Temple Material</option>
              {materials.map((m) => (
                <>
                  {m.IsActive === 1 && m.MaterialFor === 0 && (
                    <option key={m.Id} value={m.Id}>
                      {m.MaterialName}
                    </option>
                  )}
                </>
              ))}
            </select>
          </div>
          <div>
            <label>Front Material</label>
            <select
              name="FrontMaterialID"
              value={formData.FrontMaterialID}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Front Material</option>
              {materials.map((m) => (
                <>
                  {m.IsActive === 1 && m.MaterialFor === 0 && (
                    <option key={m.Id} value={m.Id}>
                      {m.MaterialName}
                    </option>
                  )}
                </>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-10 items-center">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="Category"
                  value="0"
                  checked={formData.Category === "0"}
                  onChange={handleChange}
                  disabled={isEnabled}
                />
                Optical Frame
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="Category"
                  value="1"
                  checked={formData.Category === "1"}
                  onChange={handleChange}
                  disabled={isEnabled}
                />
                Sunglasses
              </label>
            </div>
            {errors.Category && (
              <p className="text-red-500 text-sm">{errors.Category}</p>
            )}
          </div>
          <label className="flex gap-2 items-baseline">
            <input
              type="checkbox"
              name="IsRxable"
              checked={formData.IsRxable}
              onChange={handleChange}
              disabled={isEnabled}
            />
            Rx-able
          </label>
          <label className="flex gap-2 items-baseline">
            <input
              type="checkbox"
              name="IsClipOn"
              checked={formData.IsClipOn}
              onChange={handleChange}
              disabled={isEnabled}
            />
            Clip-on
          </label>
          {formData.IsClipOn && (
            <div className="flex gap-2 items-center">
              <label>No Of Clips:</label>
              <Input
                name="NoOfClips"
                value={formData.NoOfClips}
                onChange={handleChange}
                error={errors.NoOfClips}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 items-center">
          <div>
            <label>Gender</label>
            <select
              name="Gender"
              value={formData.Gender}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Gender</option>
              <option value="0">Male</option>
              <option value="1">Female</option>
              <option value="2">Mids</option>
              <option value="3">Adult</option>
            </select>
          </div>

          <div>
            <label>HSN Code *</label>
            <input
              type="text"
              name="HSN"
              value={formData.HSN}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            />
            {errors.HSN && <p className="text-red-500 text-sm">{errors.HSN}</p>}
          </div>
          <div>
            <label>Tax % *</label>
            <select
              name="TaxID"
              value={formData.TaxID}
              onChange={handleChange}
              className="input"
              disabled={isEnabled}
            >
              <option value="">Select Tax</option>
              {taxOptions.map((tax) => (
                <option key={tax.Id} value={tax.Id}>
                  {tax.Name}
                </option>
              ))}
            </select>
            {errors.TaxID && (
              <p className="text-red-500 text-sm">{errors.TaxID}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label>Capture Serial No</label>
            <Radio
              label="Yes"
              name="CaptureSlNo"
              type="radio"
              value="0"
              checked={formData.CaptureSlNo === "0"}
              onChange={handleChange}
              disabled={isEnabled}
            />
            <Radio
              label="No"
              type="radio"
              name="CaptureSlNo"
              value="1"
              checked={formData.CaptureSlNo === "1"}
              onChange={handleChange}
              disabled={isEnabled}
            />
          </div>
        </div>
      </form>
    );
  }
);

export default FrameMasterForm;
