import { useState } from "react";
import { Check, Edit, ChevronDown, ChevronUp, Info } from "lucide-react";
import toast from "react-hot-toast";

const SectionWrapper = ({
  title,
  isActive,
  onComplete,
  isComplete,
  children,
  showTooltip = true,
}) => {
  const [expanded, setExpanded] = useState(isActive);

  const handleCompleteClick = () => {
    if (onComplete()) {
      toast.success("Secțiune completată!");
    } else {
      toast.error(
        "Completati toate informatiile inainte sa treceti la urmatoarea sectiune."
      );
    }
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-md space-y-4 transition-colors duration-200 ${
        isActive
          ? "bg-gray-100" // active section slightly darker
          : "bg-gray-50 text-gray-400 cursor-not-allowed"
      }`}
      onMouseEnter={() => {
        if (!isActive && showTooltip) {
          toast("Completati sectiunea curenta", { icon: <Info size={16} /> });
        }
      }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            onClick={handleCompleteClick}
            className={`text-white p-1 rounded-full ${
              isComplete
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isComplete ? <Edit size={16} /> : <Check size={16} />}
          </button>
        </div>
      </div>
      {expanded && children}
    </div>
  );
};

export default SectionWrapper;
