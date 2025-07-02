import { FiAlertCircle, FiInfo } from "react-icons/fi";

const FormInput = ({
  label,
  name,
  register,
  error,
  icon: Icon,
  className = "",
  description,
  ...props
}) => {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {error && (
          <span className="text-xs text-red-500 flex items-center">
            <FiAlertCircle className="mr-1" /> {error.message}
          </span>
        )}
      </div>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${error ? "text-red-400" : "text-gray-400"}`} />
          </div>
        )}
        <input
          id={name}
          {...register(name)}
          {...props}
          className={`block w-full rounded-lg border py-2 shadow-sm focus:ring-2 focus:ring-offset-1 ${
            Icon ? "pl-10" : "pl-3"
          } ${
            error 
              ? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500" 
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } ${props.disabled ? "bg-gray-50" : ""}`}
        />
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-500 flex items-center">
          <FiInfo className="mr-1" /> {description}
        </p>
      )}
    </div>
  );
};

export default FormInput