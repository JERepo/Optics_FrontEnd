const Toggle = ({ enabled, onToggle ,title}) => {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 transition duration-200 ease-in-out rounded-full ${
        enabled ? "bg-green-500" : "bg-gray-300"
      }`}
      title={title || "Active/DeActive"}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transform transition ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default Toggle;
