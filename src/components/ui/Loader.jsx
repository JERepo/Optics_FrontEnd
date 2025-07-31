const Loader = ({ color = "border-neutral-50" }) => {
  return (
    <div className="">
      <div
        className={`h-6 w-6 animate-spin rounded-full border-2 ${color} border-t-transparent`}
      />
    </div>
  );
};

export default Loader;
