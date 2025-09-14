import { useGRN } from "../../features/GRNContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";




export default function GRNStep3AgainstPO() {

    // Context 
    const { grnData, updateStep3Data, nextStep, prevStep } = useGRN();

    const [formState, setFormState] = useState({
        againstPO: String(grnData.step1.againstPO || 1),
        GRNAgainstPOorderType: 'Auto Processing'    // 1: Auto processing && 2: Specific Order
    });

    const handleOptionChange = (option) => {
        setFormState((prev) => ({ ...prev, GRNAgainstPOorderType: option }));
    };

    const handleNext = () => {
        if (formState.GRNAgainstPOorderType) {
            updateStep3Data({ GRNAgainstPOorderType: formState.GRNAgainstPOorderType });
            nextStep();
        }
    };
    const handleBack = () => {
        prevStep();
    };

    return (
        <>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-6"
            >
                <h2 className="text-xl font-bold text-[#000060] mb-6">Step 3</h2>

                <div className="flex justify-start gap-12">
                    {['Auto Processing', 'Specific Order'].map((option) => (
                        <label
                            key={option}
                            htmlFor={`option-${option}`}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <input
                                id={`option-${option}`}
                                name="option"
                                type="radio"
                                checked={formState.GRNAgainstPOorderType === option}
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
                        disabled={!formState.GRNAgainstPOorderType}
                    >
                        Next
                    </button>
                </div>
            </motion.div>
        </>
    )
};