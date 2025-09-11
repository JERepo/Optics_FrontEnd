import { useMemo, useState } from "react";
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
} from "react-icons/fi";
import { useNavigate } from "react-router";
import { Table, TableCell, TableRow } from "../../../components/Table";
import Button from "../../../components/ui/Button";
import { useGetAllGiftVouchersQuery } from "../../../api/giftVoucher";
import { format } from "date-fns";
import { formatINR } from "../../../utils/formatINR";

const NewGVMain = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: giftData, isLoading: isGiftDataLoading } =
    useGetAllGiftVouchersQuery();
  console.log(giftData);
  const gift = useMemo(() => {
    if (!giftData?.data.data) return [];

    return giftData?.data.data.map((g) => ({
      id: g.ID,
      gvCode: g.GVCode,
      gvAmount: g.GVAmount,
      GVBalanceAmount:g.GVBalanceAmount,
      GVExpiryDate:g.GVExpiryDate,
      status: g.Status === 0 ? "Inactive" : "Active",
    }));
  }, [giftData, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPools = gift.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(gift.length / pageSize);

  return (
    <div className="max-w-8xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="text-2xl text-neutral-700 font-semibold">
            Gift Voucher
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

            <Button
              icon={FiPlus}
              iconPosition="left"
              className="bg-primary/90 text-neutral-50 hover:bg-primary/70 transition-all whitespace-nowrap"
              onClick={() => {
                navigate("/newgv/create");
              }}
            >
              Add New GV
            </Button>
          </div>
        </div>

        <Table
          columns={[
            "S.No",
            "gv code",
            "gv amount",
            "gv balance",
            "gv expiry",
            "status",
          ]}
          data={paginatedPools}
          renderRow={(item, index) => (
            <TableRow key={item.id}>
              <TableCell className="text-sm font-medium text-neutral-900">
                {startIndex + index + 1}
              </TableCell>
              <TableCell>{item.gvCode}</TableCell>
              <TableCell>₹{formatINR(item.gvAmount)}</TableCell>
              <TableCell>₹{formatINR(item.GVBalanceAmount)}</TableCell>
              <TableCell>
                {item.GVExpiryDate
                  ? item.GVExpiryDate.split("-").reverse().join("/")
                  : "-"}
              </TableCell>
              <TableCell>{item.status}</TableCell>
            </TableRow>
          )}
          emptyMessage={isGiftDataLoading ? "Loading" : "No data"}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={gift.length}
        />
      </div>
    </div>
  );
};

export default NewGVMain;
