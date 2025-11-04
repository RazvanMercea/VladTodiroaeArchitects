import React from "react";
import Lottie from "lottie-react";

const SpinnerOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
      <Lottie
        animationData={require("../public/animations/house.json")}
        loop={true}
        className="w-96 h-96 mb-6 max-w-full max-h-[80vh]"
      />
      <p className="text-white font-semibold text-2xl animate-pulse">
        Se adauga un proiect nou...
      </p>
    </div>
  );
};

export default SpinnerOverlay;
