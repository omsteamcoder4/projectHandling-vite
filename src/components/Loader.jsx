const Loader = ({ size = "medium" }) => {
  const sizes = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8"
  };

  return (
    <div className="flex justify-center">
      <div className={`animate-spin rounded-full ${sizes[size]} border-t-2 border-b-2 border-blue-500`}></div>
    </div>
  );
};

export default Loader;