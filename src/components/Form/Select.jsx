const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  className = "",
  optionValue,
  optionLabel,
  error,
  defaultOption,
  ...props
}) => {
  return (
    <div className={` ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        {...props}
      >
        <option value="">{defaultOption}</option>
        {options?.map((option) => (
          <option key={option[optionValue]} value={option[optionValue]}>
            {option[optionLabel]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
