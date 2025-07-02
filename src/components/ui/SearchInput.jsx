import { FiSearch } from "react-icons/fi";

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1 min-w-[250px]">
    <label className="text-neutral-500 text-sm">Search</label>
    <div className="flex items-center gap-2 border-2 border-neutral-300 rounded-md px-3 h-10 bg-white">
      <FiSearch className="text-neutral-500 text-lg" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full outline-none text-sm text-neutral-700 placeholder-neutral-400 bg-transparent"
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

export default SearchInput;
