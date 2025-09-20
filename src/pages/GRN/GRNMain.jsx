import { useGRN } from "../../features/GRNContext";
import { motion, AnimatePresence } from "framer-motion";
import GRNStep1 from "./GRNStep1";
import GRNStep2 from "./GRNStep2";
import { ArrowLeft } from "lucide-react";
import GRNStep3 from "./GRNStep3";
import GRNStep4 from "./GRNStep4";
import GRNStep3AgainstPO from "./GRNStep3AgainstPO";
import GRNStep4AgainstPO from "./GRNStep4AgainstPO";

export default function GRNMain() {
    // Context
    const { grnData, currentStep, updateStep1Data, nextStep, prevStep, resetGRN } = useGRN();

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <GRNStep1 />;
            case 2:
                return <GRNStep2 />;
            case 3:
                return (grnData?.step1?.againstPO === "1" ? <GRNStep3AgainstPO /> : <GRNStep3 />);
            case 4:
                return (grnData?.step1?.againstPO === "1" ? <GRNStep4AgainstPO /> : <GRNStep4 />);
            case 5:
                return <GRNStep4 />;
            default:
                return <GRNStep1 />;
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >

                {/* Header Information for GRN page */}
                <header className="">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 p-4"
                    >
                        <div className="">
                            <button className="text-[#000060] hover:text-[#0000a0] transition-colors flex items-center mb-3">
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to dashboard
                            </button>
                            <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">
                                GRN
                            </h1>
                            <div className="flex items-center mt-2">
                                <div className={`flex items-center ${currentStep === 1 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        1
                                    </div>
                                    <span>GRN Information</span>
                                </div>
                                <div className="mx-2 text-gray-400">→</div>
                                <div className={`flex items-center ${currentStep === 2 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        2
                                    </div>
                                    <span>Product Type</span>
                                </div>
                                <div className="mx-2 text-gray-400">→</div>
                                <div className={`flex items-center ${currentStep === 3 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        3
                                    </div>
                                    <span>GRN List</span>
                                </div>
                                <div className="mx-2 text-gray-400">→</div>
                                <div className={`flex items-center ${currentStep === 4 ? 'font-bold text-shadow-primary' : 'text-gray-500'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep === 4 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                        4
                                    </div>
                                    <span>Review</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* GRN Steps */}
                {renderCurrentStep()}
            </motion.div>
        </>
    )
}