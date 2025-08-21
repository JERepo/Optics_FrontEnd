const Input = ({ label, type = "text", name, placeholder, value, onChange, error, className = "",grayOut, ...props }) => {
  return (
    <div className={`relative ${className}`}> {/* Make container relative for absolute error positioning */}
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative"> {/* Wrapper for input to ensure spacing */}
        <input
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${!grayOut ?  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" : "bg-neutral-200 pointer-events-none w-full px-3 py-2  border rounded-md shadow-sm "} ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          {...props}
        />
        {/* Error message (absolutely positioned below input) */}
        {error && (
          <p className="absolute left-0 top-full mt-1 text-sm text-red-600 whitespace-normal break-words">
            {error}
          </p>
        )}
      </div>
      {/* Reserve space for error (hidden when no error) */}
      <div className={`h-5 ${error ? "invisible" : ""}`}></div>
    </div>
  );
};

export default Input;