import React, { useState } from "react";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import { useOrder } from "../../../features/OrderContext";
import { useGetAllBrandsQuery } from "../../../api/brandsApi";
import { Autocomplete, TableCell, TextField } from "@mui/material";
import {
  useGetModalitiesQuery,
  useGetProductNamesByModalityQuery,
} from "../../../api/orderApi";
import { isValidNumericInput } from "../../../utils/isValidNumericInput";
import toast from "react-hot-toast";
import Input from "../../../components/Form/Input";
import Radio from "../../../components/Form/Radio";
import { Table, TableRow } from "../../../components/Table";
import { useSaveOfferProductMutation } from "../../../api/offerApi";

const ContactLens = () => {
  const {
    currentOfferStep,
    selectedOfferProduct,
    prevOfferStep,
    customerOffer,
    goToOfferStep,
  } = useOrder();
  const [brandId, setBrandId] = useState(null);
  const [showProduct, setShowProduct] = useState(false);
  const [modalityId, setModalityId] = useState(null);
  const [product, setProduct] = useState(null);
  const [discountPV, setDiscountPV] = useState(1);
  const [discountValue, setDiscountValue] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [items, setItems] = useState([]);

  const { data: allBrandsData, isLoading: isLoadingAllBrands } =
    useGetAllBrandsQuery();
  const { data: modalities, isLoading: modalitiesLoading } =
    useGetModalitiesQuery();
  const { data: productNames, isLoading: isProductsLoading } =
    useGetProductNamesByModalityQuery(
      { brandId: brandId, modalityId: modalityId },
      { skip: !brandId || !modalityId }
    );
  const [saveCL, { isLoading: isClSaving }] = useSaveOfferProductMutation();
  const filteredBrands = allBrandsData?.filter(
    (b) => b.ContactLensActive === 1 && b.IsActive === 1
  );

  const handleRefresh = () => {
    setBrandId(null);
    setModalityId(null);
    setProduct(null);
    setQuantity("");
    setDiscountValue("");
    setDiscountPV(1);
    setShowProduct(false);
    // setItems([])
  };
  console.log(items);
  const handleDelete = (index) => {
    const updatedItem = items.filter((item, i) => i !== index);
    setItems(updatedItem);
  };
  const handleAddProduct = () => {
    if (!brandId) {
      toast.error("Please select the brand!");
      return;
    }
    if (!quantity) {
      toast.error("Please Enter the quantity!");
      return;
    }
    if (!discountValue) {
      toast.error("Please Enter the discount");
      return;
    }
    const newItem = {
      brandName:
        allBrandsData?.find((item) => item.Id === brandId)?.BrandName ?? null,
      productName:
        productNames?.data.data.find((p) => p.Id === product?.Id)
          ?.ProductName ?? null,
      qty: parseInt(quantity),
      discountType: discountPV,
      discountValue: discountValue,
      productId: product?.Id,
      brandId: brandId,
      modalityId: modalityId,
    };

    setItems((prev) => [...prev, newItem]);

    handleRefresh();
  };

  const handleSave = async () => {
    if (items.length <= 0) {
      toast.error("Please add atleast one item");
      return;
    }

    const payload = {
      entries: items.map((item) => ({
        OfferMainId: customerOffer.offerMainId || 10,
        ProductType: 3,
        BrandId: item.brandId ?? null,
        CLMainID: item.productId ?? null,
        CLDetailID: null,
        Qty: item.qty,
        DiscountType: item.discountType,
        DiscountPerct:
          item.discountType === 0 ? parseFloat(item.discountValue) : null,
        DiscountValue:
          item.discountType === 1 ? parseFloat(item.discountValue) : null,
      })),
    };
    console.log(payload);

    try {
      await saveCL(payload).unwrap();
      toast.success("Contact lens successfully saved")
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div className="max-w-8xl h-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className=" flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Step {currentOfferStep}: {selectedOfferProduct.label}
            </h1>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={prevOfferStep}
                icon={FiArrowLeft}
                variant="outline"
              >
                Back
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-5">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">
                Search by Brand
              </label>
              <div className="flex flex-col gap-2 max-w-lg">
                <Autocomplete
                  options={filteredBrands}
                  getOptionLabel={(option) => option.BrandName}
                  onChange={(event, newValue) => {
                    setBrandId(newValue ? newValue.Id : null);
                  }}
                  value={filteredBrands?.find((b) => b.Id === brandId) || null}
                  isOptionEqualToValue={(option, value) =>
                    option.Id === value.Id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Brand"
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  )}
                />
                <div
                  className="flex justify-end underline cursor-pointer text-blue-600"
                  onClick={() => setShowProduct(true)}
                >
                  Add Product
                </div>
              </div>
            </div>

            {/* Modality */}
            {brandId && showProduct && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Modality
                </label>
                <Autocomplete
                  options={modalities?.data || []}
                  getOptionLabel={(option) => option.ModalityName || ""}
                  value={
                    modalities?.data.find((m) => m.Id === modalityId) || null
                  }
                  onChange={(_, newValue) =>
                    setModalityId(newValue?.Id || null)
                  }
                  loading={modalitiesLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select modality"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.Id === value.Id
                  }
                />
              </div>
            )}

            {/* Product */}
            {modalityId && showProduct && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <Autocomplete
                  options={productNames?.data?.data || []}
                  getOptionLabel={(option) => option.ProductName || ""}
                  value={
                    productNames?.data.data.find((p) => p.Id === product?.Id) ||
                    null
                  }
                  onChange={(_, newValue) => setProduct(newValue || null)}
                  loading={isProductsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search or select product"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.Id === value.Id
                  }
                />
              </div>
            )}
          </div>
          {/* Quantity + Discount */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="flex gap-5">
              <Input
                type="number"
                label="Minimum Qty to Order"
                className="w-full"
                value={quantity ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isValidNumericInput(val)) setQuantity(val);
                }}
              />
            </div>

            {/* Discount section */}
            <div className="">
              <div className="flex items-center gap-5">
                <Radio
                  name="discount"
                  value="1"
                  onChange={() => setDiscountPV(1)}
                  checked={discountPV === 1}
                  label="Discount Value"
                />
                <Radio
                  name="discount"
                  value="0"
                  onChange={() => setDiscountPV(0)}
                  checked={discountPV === 0}
                  label="Discount Percentage %"
                />
              </div>

              <div className="mt-1">
                <Input
                  type="number"
                  placeholder={
                    discountPV === 1
                      ? "Enter Discount Value"
                      : "Enter Discount Percentage %"
                  }
                  value={discountValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setDiscountValue("");
                      return;
                    }
                    if (!isValidNumericInput(val)) return;
                    if (discountPV === 0 && parseFloat(val) > 100) {
                      toast.error("Percentage cannot exceed 100!");
                      return;
                    }
                    setDiscountValue(val);
                  }}
                />
              </div>
            </div>
          </div>
          {items.length > 0 && (
            <div className="">
              <Table
                columns={[
                  "S.No",
                  "brand name",
                  "product name",
                  "minqty",
                  "discount",
                  "action",
                ]}
                data={items}
                renderRow={(item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.brandName}</TableCell>
                    <TableCell>{item.productName ?? "-"}</TableCell>
                    <TableCell>{item.qty}</TableCell>
                    <TableCell>
                      {item.discountType === 0
                        ? `${item.discountValue}%`
                        : `₹${item.discountValue}`}
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => handleDelete(index)}
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
          <div className="mt-5 flex gap-3 justify-between">
            <Button icon={FiPlus} onClick={handleAddProduct}>
              Add
            </Button>
            <Button onClick={handleSave} isLoading={isClSaving} disabled={isClSaving}>Save & Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLens;
