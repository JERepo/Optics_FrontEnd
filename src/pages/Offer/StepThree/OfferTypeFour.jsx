import React, { useState } from "react";
import { useOrder } from "../../../features/OrderContext";
import Button from "../../../components/ui/Button";
import Input from "../../../components/Form/Input";
import { isValidNumericInput } from "../../../utils/isValidNumericInput";
import toast from "react-hot-toast";
import Radio from "../../../components/Form/Radio";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Table, TableCell, TableRow } from "../../../components/Table";
import { useCreateOfferType4Mutation } from "../../../api/offerApi";
import { useNavigate } from "react-router";

const OfferTypeFour = () => {
  const navigate = useNavigate();

  const { customerOffer, setCusomerOffer, goToOfferStep } = useOrder();
  const [discountPV, setDiscountPV] = useState(1);
  const [discountValue, setDiscountValue] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [slabStart, setSlabStart] = useState(0);
  const [slabEnd, setSlabEnd] = useState(0);
  const [items, setItems] = useState([]);

  const [createOffer, { isLoading: isOfferCreating }] =
    useCreateOfferType4Mutation();

  const handleDelete = (index) => {
    const updatedItem = items.filter((item, i) => i !== index);
    setItems(updatedItem);
  };
  const handleRefresh = () => {
    setSlabStart(0);
    setSlabEnd(0);
    setQuantity(1);
    setDiscountValue("");
  };
  const handleAdd = () => {
    if (!quantity || quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (!slabStart || !slabEnd) {
      toast.error("Please enter slab entries");
      return;
    }

    if (parseFloat(slabStart) === parseFloat(slabEnd)) {
      toast.error("Slab Start and Slab End cannot be the same");
      return;
    }

    if (items.length > 0) {
      const lastSlab = items[items.length - 1];
      if (parseFloat(slabStart) <= parseFloat(lastSlab.slabEnd)) {
        toast.error("Slab Start must be greater than the previous Slab End");
        return;
      }
    }

    const newItem = {
      quantity: parseFloat(quantity),
      discountPV,
      discountValue: parseFloat(discountValue),
      slabStart: parseFloat(slabStart),
      slabEnd: parseFloat(slabEnd),
    };

    setItems((prev) => [...prev, newItem]);
    toast.success("Item added successfully!");
    handleRefresh();
  };

  const handleSave = async () => {
    if (items.length <= 0) {
      toast.error("Please add at least one offer");
      return;
    }

    const payload = {
      OfferMainId: customerOffer.offerMainId ?? null,
      slabs: items.map((item) => ({
        SlabStart: parseFloat(item.slabStart),
        SlabEnd: parseFloat(item.slabEnd),
        DiscountType: item.discountPV,
        DiscountPerct:
          item.discountPV === 0 ? parseFloat(item.discountValue) : null,
        DiscountValue:
          item.discountPV === 1 ? parseFloat(item.discountValue) : null,
      })),
    };

    try {
      await createOffer(payload).unwrap();
      toast.success("OfferType4 successfully created");
      navigate("/offer");
    } catch (error) {
      console.log(error);
      toast.error("Failed to create OfferType4");
    }
  };

  return (
    <div>
      <div className="max-w-8xl">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-neutral-700">
              Step 2: Slab Details
            </span>
            <div>
              <Button variant="outline" onClick={() => navigate("/offer")}>Back</Button>
            </div>
          </div>
          {items.length > 0 && (
            <div className="my-5">
              <Table
                columns={[
                  "S.No",
                  "slab start",
                  "slab end",
                  "minqty",
                  "discount",
                  "action",
                ]}
                data={items}
                renderRow={(item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.slabStart}</TableCell>
                    <TableCell>{item.slabEnd}</TableCell>

                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.discountPV === 0
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
          <div className="grid grid-cols-3 gap-5 mt-5">
            <div className="flex gap-5">
              <Input
                type="number"
                label="Minimum Qty to Order"
                className="w-full"
                value={quantity}
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
                    if (isValidNumericInput(val)) setDiscountValue(val);
                    if (discountPV === 0 && parseFloat(val) > 100) {
                      toast.error("Percentage cannot exceed 100!");
                      return;
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="grid grid-cols-3 gap-5">
              <Input
                type="number"
                label="Slab Start"
                className="w-full"
                value={slabStart}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isValidNumericInput(val)) setSlabStart(val);
                }}
              />
              <Input
                type="number"
                label="Slab End"
                className="w-full"
                value={slabEnd}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isValidNumericInput(val)) setSlabEnd(val);
                }}
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3 justify-between">
            <Button icon={FiPlus} onClick={handleAdd}>
              Add
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isOfferCreating}
              disabled={isOfferCreating}
            >
              Create Offer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferTypeFour;
