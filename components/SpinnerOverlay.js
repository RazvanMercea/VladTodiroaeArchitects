// components/SpinnerOverlay.js
import React from "react";

const SpinnerOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute bottom-0 w-24 h-16 bg-gray-200 rounded shadow"></div>
        <div className="absolute top-0 w-0 h-0 border-l-12 border-r-12 border-b-12 border-b-red-500 animate-pulseRoof"></div>
      </div>
      <p className="text-white font-semibold text-lg animate-pulse">
        Se adauga nou proiect...
      </p>

      <style jsx>{`
        @keyframes pulseRoof {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(5px); }
        }
        .animate-pulseRoof {
          animation: pulseRoof 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default SpinnerOverlay;
