const CustomLoader = ({ label = "Loading" }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
  
      <div className="flex space-x-2">
        <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full bg-opacity-75 animate-bounce"></div>
        <div 
          className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full bg-opacity-75 animate-bounce" 
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full bg-opacity-75 animate-bounce" 
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      {label && (
        <span className="text-sm md:text-base font-medium text-blue-600 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default CustomLoader;