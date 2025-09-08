const Checkbox = ({ label, name, checked, onChange, className = "", ...props }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        {...props}
      />
      {label && (
        <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;