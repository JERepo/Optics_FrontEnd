const Radio = ({ label, name, value, checked, onChange, className = "", ...props }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="radio"
        id={`${name}-${value}`}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
        {...props}
      />
      {label && (
        <label htmlFor={`${name}-${value}`} className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      )}
    </div>
  );
};

export default Radio;