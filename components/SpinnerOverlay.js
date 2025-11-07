import React from "react";
import Lottie from "lottie-react";
import houseAnimation from "../public/animations/house.json"; // import ES6

const SpinnerOverlay = ({ message = "Se încarcă proiectele..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
      <div className="w-96 h-96 max-w-full max-h-[80vh] mb-6">
        <Lottie animationData={houseAnimation} loop={true} />
      </div>
      <p className="text-white font-semibold text-2xl animate-pulse text-center px-4">
        {message}
      </p>
    </div>
  );
};

export default SpinnerOverlay;
