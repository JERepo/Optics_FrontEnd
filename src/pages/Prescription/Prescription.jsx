import { useMemo, useRef, useState } from "react";
import {
  FiCalendar,
  FiClipboard,
  FiEye,
  FiFileText,
  FiPlus,
  FiSearch,
  FiUser,
  FiX,
  FiTrash2,
  FiPrinter,
} from "react-icons/fi";
import { useNavigate } from "react-router";
import HasPermission from "../../components/HasPermission";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { Table, TableCell, TableRow } from "../../components/Table";
import Button from "../../components/ui/Button";
import {
  useDeActivatePrescriptionMutation,
  useGetAllPrescriptionsQuery,
  useLazyGetAllPrescriptionByPatientQuery,
  useLazyGetPrescriptionPrintQuery,
} from "../../api/orderApi";
import { useGetAllSalesPersonsQuery } from "../../api/salesPersonApi";
import { useOrder } from "../../features/OrderContext";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Loader from "../../components/ui/Loader";
import { useSelector } from "react-redux";

const Prescription = () => {
  const navigate = useNavigate();
  const { user, hasMultipleLocations } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showMainData, setShowMainData] = useState(false);
  const [loadingPatientId, setLoadingPatientId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const { data: allPrescriptions, isLoading } = useGetAllPrescriptionsQuery();
  const [
    getPrescriptions,
    {
      data: allPrescriptionData,
      isLoading: isPrescriptionLoading,
      isFetching: isPresFetching,
    },
  ] = useLazyGetAllPrescriptionByPatientQuery();
  const { data: salesPersons } = useGetAllSalesPersonsQuery();

  const prescriptions = useMemo(() => {
    if (!allPrescriptions?.data.data) return [];

    const seenPatients = new Set();
    const uniquePrescriptions = [];

    for (const pers of allPrescriptions?.data?.data || []) {
      const patientName = pers.CustomerContactDetail.CustomerName;

      if (!seenPatients.has(patientName)) {
        seenPatients.add(patientName);
        uniquePrescriptions.push({
          id: pers.Id,
          item: pers,
          patientName,
          mobile: pers.CustomerContactDetail?.MobNumber,
          remarks: pers.Remarks,
          date: pers.PrescriptionDate,
        });
      }
    }

    return uniquePrescriptions.filter((pers) => {
      const query = searchQuery?.toLowerCase();
      return (
        pers.patientName?.toLowerCase().includes(query) ||
        pers.mobile?.toLowerCase().includes(query)
      );
    });
  }, [allPrescriptions, searchQuery, isLoading]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = prescriptions.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(prescriptions.length / pageSize);

  const handleShowDetails = async (item) => {
    try {
      setLoadingPatientId(item.PatientID);
      const response = await getPrescriptions({ patientId: item.PatientID });
      const data = response?.data;
      if (data.length <= 0) {
        toast.error("Selected Patient doesn't have any Prescriptions!");
        return;
      }
      // Set the first prescription as selected and open the modal
      const parsedPrescription = {
        name: item.CustomerContactDetail.CustomerName,
        ...data[0],
        values: {
          R: {
            SPH: data[0].RSPH,
            CYL: data[0].RCYD,
            Axis: data[0].RAxis,
            ADD: data[0].RAddOn,
            Prism: data[0].RPrism,
            Base: data[0].RBase,
            VisualAcuity: data[0].RVisualAcuity,
          },
          L: {
            SPH: data[0].LSPH,
            CYL: data[0].LCYD,
            Axis: data[0].LAxis,
            ADD: data[0].LAddOn,
            Prism: data[0].LPrism,
            Base: data[0].LBase,
            VisualAcuity: data[0].LVisualAcuity,
          },
        },
      };
      setSelectedPrescription(parsedPrescription);
      setShowMainData(true);
    } catch (error) {
      toast.error("Failed to get Prescriptions try again!");
      console.log(error);
    } finally {
      setLoadingPatientId(null); // Reset after load
    }
  };

  const handleView = (prescription) => {
    console.log("pre", prescription)
    setSelectedId(prescription?.Id);
    const parsedPrescription = {
      name: prescription?.CustomerContactDetail.CustomerName,
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

  return (
    <div className="max-w-8xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="text-3xl text-neutral-700 font-semibold">
          Prescription
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 border-2 border-neutral-300 rounded-md px-3 w-full sm:w-[250px] h-10 bg-white">
            <FiSearch className="text-neutral-500 text-lg" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm text-neutral-700 placeholder-neutral-400 bg-transparent"
            />
          </div>
          <HasPermission module="Prescription" action="create">
            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => {
                navigate("create");
              }}
            >
              Add Prescription
            </Button>
          </HasPermission>
        </div>
      </div>

      <Table
        columns={[
          "S.No",
          "Patient name",
          "Prescription Remarks",
          "Mobile no",
          "Prescription date",
          "Action",
        ]}
        data={paginatedPools}
        renderRow={(pool, index) => (
          <TableRow key={pool.id}>
            <TableCell className="text-sm font-medium text-neutral-900">
              {startIndex + index + 1}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.patientName}
            </TableCell>

            <TableCell className="text-sm text-neutral-500">
              {pool.remarks}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.mobile}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {(() => {
                const [year, month, day] = pool.date.split("-");
                return `${day}-${month}-${year}`;
              })()}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Prescription" action="view">
                  {loadingPatientId === pool.item.PatientID ? (
                    <Loader className="w-4 h-4" color="black" />
                  ) : (
                    <FiEye
                      onClick={() => handleShowDetails(pool.item)}
                      className="text-xl cursor-pointer"
                      title="View"
                    />
                  )}
                </HasPermission>
              </div>
            </TableCell>
          </TableRow>
        )}
        emptyMessage={
          isLoading
            ? "Loading Prescription..."
            : searchQuery
              ? "No Prescription match your search criteria"
              : "No Prescription found. Click 'Add Prescription' to create one."
        }
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={prescriptions.length}
      />

      <DisplayMainData
        isOpen={showMainData}
        onClose={() => setShowMainData(false)}
        salesPersons={salesPersons}
        allPrescriptionData={allPrescriptionData}
        selectedPrescription={selectedPrescription}
        setSelectedPrescription={setSelectedPrescription}
        handleView={handleView}
        locationId={parseInt(hasMultipleLocations[0])}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
    </div>
  );
};

export default Prescription;

const DisplayMainData = ({
  isOpen,
  onClose,
  salesPersons,
  allPrescriptionData,
  selectedPrescription,
  setSelectedPrescription,
  handleView,
  locationId,
  selectedId,
  setSelectedId,
}) => {
  const [getPrescriptionPrint, { isFetching: isPrintFetching }] =
    useLazyGetPrescriptionPrintQuery();

  const modalContentRef = useRef(null);
  const [printingId, setPrintingId] = useState(null);

  const handleViewWithScroll = (prescription) => {
    handleView(prescription);
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = allPrescriptionData?.slice(
    startIndex,
    startIndex + pageSize
  );
  const totalPages = Math.ceil(allPrescriptionData?.length / pageSize);

  const handlePrint = async (item) => {
    const { Id, PatientID } = item;
    setPrintingId(Id);

    try {
      const blob = await getPrescriptionPrint({
        id: Id,
        patientId: PatientID,
        companyId: locationId,
      }).unwrap();

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));

      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedPrescription?.name}_Prescription.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSelectedId(null);
      console.log(error);
      toast.error(
        "Unable to print the prescription. Please try again after some time!"
      );
    } finally {
      setPrintingId(null);
    }
  };


  console.log(selectedPrescription)
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-4xl"
      scrollRef={modalContentRef}
    >
      <div>
        {selectedPrescription && (
          <div className="space-y-6">
            {/* Prescription Details */}
            <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FiClipboard className="mr-2 text-blue-500" />
                  Prescription Details
                </h2>
                <button
                  className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={() => handlePrint(selectedPrescription)}
                >
                  {printingId === selectedPrescription?.Id ? (
                    <Loader color="black" />
                  ) : (
                    <div className="flex items-center">
                      <FiPrinter className="mr-1.5" />
                      Print
                    </div>
                  )}
                </button>
              </div>

              <div className="p-6">
                {/* Metadata Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Patient Name</p>
                      <p className="font-medium">
                        {selectedPrescription?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Prescription Date</p>
                      <p className="font-medium">
                        {selectedPrescription?.PrescriptionDate?.split("-")
                          .reverse()
                          .join("/")}
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
                      <p className="text-sm text-gray-500">Optometrist</p>
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
                      <p className="text-sm text-gray-500">Prescription From</p>
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
                            <th
                              key={item}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
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
                              {selectedPrescription.values?.[side]?.SPH ?? "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {selectedPrescription.values?.[side]?.CYL ?? "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {selectedPrescription.values?.[side]?.Axis ??
                                "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {selectedPrescription.values?.[side]?.ADD ?? "--"}
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

            {/* Additional Prescriptions Table */}
            {allPrescriptionData?.length > 1 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FiClipboard className="mr-2 text-blue-500" />
                  Other Prescriptions
                </h3>
                <Table
                  columns={["Prescription Date", "Remarks", "Actions"]}
                  headerClassName="bg-gray-50 text-gray-700 font-medium"
                  data={paginatedPools?.filter(
                    (p) => p.Id !== selectedPrescription.Id
                  )}
                  renderRow={(p, index) => (
                    <TableRow key={p.Id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center text-gray-900">
                          <FiCalendar className="mr-2 text-gray-400" />
                          {p.PrescriptionDate.split("-").reverse().join("/")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-gray-600">
                          <FiFileText className="mr-2 text-gray-400" />
                          {p.Remarks}
                        </div>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => handleViewWithScroll(p)}
                        >
                          <FiEye className="mr-1.5" />
                          View
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={() => handlePrint(p)}
                        >
                          {printingId === p.Id ? (
                            <Loader color="black" />
                          ) : (
                            <div className="flex items-center">
                              <FiPrinter className="mr-1.5" />
                              Print
                            </div>
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                  pagination={true}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  totalItems={allPrescriptionData?.length}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
