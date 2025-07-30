import { useMemo, useState } from "react";
import { FiEye, FiPlus, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router";
import HasPermission from "../../components/HasPermission";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { Table, TableCell, TableRow } from "../../components/Table";
import Button from "../../components/ui/Button";

const Prescription = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const locale = navigator.language || navigator.languages[0] || "en-IN";

  const data = [];
  const isLoading = false;
  const prescriptions = useMemo(() => {
    if (!data?.data) return [];

    return data?.data?.data
      .map((pers) => ({
       
      }))
      .filter((pers) => {
        const query = searchQuery.toLowerCase();
        return (
          pers.name.toLowerCase().includes(query) ||
          pers.group.toLowerCase().includes(query) ||
          pers.location.toLowerCase().includes(query)
        );
      });
  }, [data, searchQuery, isLoading]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = prescriptions.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(prescriptions.length / pageSize);

  return (
    <div className="max-w-6xl">
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
          // "from",
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
              {pool.name}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.location}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.phone}
            </TableCell>
            <TableCell className="text-sm text-neutral-500">
              {pool.group}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <HasPermission module="Customer" action="view">
                  <FiEye
                    onClick={() => navigate(`view/${pool.id}`)}
                    className="text-xl cursor-pointer"
                  />
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
    </div>
  );
};

export default Prescription;
