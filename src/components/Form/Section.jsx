// components/form/Section.jsx
const Section = ({ title, children }) => (
  <div className="p-6 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
      <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
      {title}
    </h2>
    {children}
  </div>
);

export default Section;
