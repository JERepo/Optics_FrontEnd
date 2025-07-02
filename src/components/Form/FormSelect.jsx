import { FiAlertCircle, FiChevronDown, FiInfo } from "react-icons/fi";

const FormSelect = ({
  label,
  name,
  register,
  options = [],
  error,
  className = "",
  description,
  ...props // includes onChange, value, etc. from Controller
}) => {
  const registerProps = register ? register(name) : {};

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        {error && (
          <span className="text-xs text-red-500 flex items-center">
            <FiAlertCircle className="mr-1" /> {error.message}
          </span>
        )}
      </div>
      <div className="relative">
        <select
          id={name}
          name={name}
          className={`block w-full rounded-lg border py-2 pl-3 pr-10 shadow-sm focus:ring-2 focus:ring-offset-1 ${
            error
              ? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
          {...registerProps}
          {...props}
        >
          {/* Show placeholder only if no role is selected */}
          {!props.value && (
            <option value="" disabled hidden>
              Select a role
            </option>
          )}

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <FiChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-500 flex items-center">
          <FiInfo className="mr-1" /> {description}
        </p>
      )}
    </div>
  );
};

export default FormSelect;
