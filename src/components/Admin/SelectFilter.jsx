import { FiChevronDown } from "react-icons/fi";

const SelectFilter = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1 min-w-[180px]">
    <label className="text-neutral-500 text-sm">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none border-2 border-neutral-300 rounded-md px-3 py-2 pr-8 w-full h-10 bg-white text-sm text-neutral-700 cursor-pointer focus:outline-none focus:border-primary/70"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 pointer-events-none" />
    </div>
  </div>
);

export default SelectFilter;
