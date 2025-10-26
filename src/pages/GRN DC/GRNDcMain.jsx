import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGRNDC } from "../../features/GRNDcContext";
import GRNDCStep1 from "./Step1";
import GRNDCStep2 from "./Step2";
import GRNDCStep3 from "./Step3";
import { useNavigate } from "react-router";

export default function GRNDcMain() {
    // Context
    const { grnData, currentStep, updateStep1Data, nextStep, prevStep, resetGRN } = useGRNDC();
    const navigate = useNavigate();


    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <GRNDCStep1 />;
            case 2:
                return <GRNDCStep2 />;
            case 3:
                return <GRNDCStep3 />;
            // case 4:
            //     return (grnData?.step1?.againstPO === "1" ? <GRNStep4AgainstPO /> : <GRNStep4 />);
            // case 5:
            //     return <GRNStep4 />;
            default:
                return <GRNDCStep1 />;
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
                            <button className="text-[#000060] hover:text-[#0000a0] transition-colors flex items-center mb-3"
                                onClick={() => {navigate(`/grn-dc`)}}
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to dashboard
                            </button>
                            <h1 className="text-3xl lg:text-4xl font-bold text-[#000060] mb-2">
                                GRN DC
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