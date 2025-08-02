const Loader = ({ color = "border-neutral-50" ,width="w-6",height="h-6" }) => {
  return (
    <div className="">
      <div
        className={`${height} ${width} animate-spin rounded-full border-2 ${color} border-t-transparent`}
      />
    </div>
  );
};

export default Loader;
