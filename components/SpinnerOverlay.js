import React from "react";
import Lottie from "lottie-react";

const SpinnerOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
      <Lottie
        animationData={require("../public/animations/house.json")}
        loop={true}
        className="w-32 h-32 mb-4"
      />
      <p className="text-white font-semibold text-lg animate-pulse">
        Se adauga nou proiect...
      </p>
    </div>
  );
};

export default SpinnerOverlay;
