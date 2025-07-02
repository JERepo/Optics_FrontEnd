const FormCheckbox = ({
  label,
  name,
  register,
  description,
  className = "",
  ...props
}) => {
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={name}
          type="checkbox"
          {...register(name)}
          {...props}
          className="focus:ring-2 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={name} className="font-medium text-gray-700">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <FiInfo className="mr-1" /> {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormCheckbox