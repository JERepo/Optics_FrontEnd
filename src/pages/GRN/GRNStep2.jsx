import { useGRN } from "../../features/GRNContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetGRNDetailsMutation } from "../../api/grnApi";
import { ArrowRightCircleIcon } from "lucide-react";
import toast from "react-hot-toast";




export default function GRNStep2() {

    // Context 
    const { grnData, updateStep2Data, nextStep, prevStep, setCurrentStep } = useGRN();
    const [productArray, setProductArray] = useState([]);
    const { user } = useSelector((state) => state.auth);

    const [getGRNDetails] = useGetGRNDetailsMutation();


    const [formState, setFormState] = useState({
        selectedGRNOptions: "order",
        vendorDetails: grnData.step1.vendorDetails,
        documentNo: grnData.step1.documentNo,
        documentDate: grnData.step1.documentDate,
        billingMethod: grnData.step1.billingMethod || "invoice",
        againstPO: String(grnData.step1.againstPO || 1),
        selectedOption: grnData.step2.productType || null,
        selectedLocation: grnData.step1.selectedLocation || null
    });

    const handleOptionChange = (option) => {
        setFormState((prev) => ({ ...prev, selectedOption: option }));
    };

    const handleNext = () => {
        if (formState.selectedOption) {
            updateStep2Data({ productType: formState.selectedOption });
            nextStep();
        }
    };
    const handleBack = () => {
        prevStep();
    };

    useEffect(() => {
        console.log("formState.againstPO -----", formState.againstPO);
        if (formState.againstPO === "0") {
            setProductArray(['Frame/Sunglass', 'Lens', 'Contact Lens', 'Accessories']);
        } else if (formState.againstPO === "1") {
            setProductArray(['Frame/Sunglass', 'Contact Lens', 'Accessories']);
        }
    }, [formState]);

    const handleRedirectStep4 = async () => {
        try {
            const body = {
                companyId: formState?.selectedLocation,
                vendorId: formState?.vendorDetails?.Id,
                againstPo: formState?.againstPO,
                applicationUserId: user?.Id,
                grnMain: grnData?.step1?.GrnMainId,
                status: 0
            }

            const grnDataResponse = await getGRNDetails(body);
            console.log("grnDataResponse --------------- ", grnDataResponse.data.data);

            // if (grnDataResponse?.data?.data && grnDataResponse?.data?.data.length > 0) {
                setCurrentStep(5);
                return;
            // }
        } catch (error) {
            console.error("Error fetching GRN details:", error);
            toast.error("Failed to fetch GRN details. Please try again.");
        }
    }

    return (
        <>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-6"
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#000060] mb-6">Step 2: Select Product</h2>
                    <button
                        onClick={handleRedirectStep4}
                        className="flex items-center gap-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                    // disabled={!formState.selectedOption}
                    >
                        <ArrowRightCircleIcon className="w-5 h-5" />
                        GRN Details
                    </button>
                </div>

                {console.log(productArray)}
                <div className="flex justify-start gap-12">
                    {productArray.map((option) => (
                        <label
                            key={option}
                            htmlFor={`option-${option}`}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <input
                                id={`option-${option}`}
                                name="option"
                                type="radio"
                                checked={formState.selectedOption === option}
                                onChange={() => handleOptionChange(option)}
                                className="h-4 w-4 text-[#000060] focus:ring-[#000060] border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-[#000060] transition-colors">
                                {option}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 border border-[#000060] text-[#000060] rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
                        disabled={!formState.selectedOption}
                    >
                        Next
                    </button>
                </div>
            </motion.div>
        </>
    )
};