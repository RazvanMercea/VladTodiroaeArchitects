import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

const SpinnerOverlay = () => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/house.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation", err));
  }, []);

  if (!animationData) return null; // optionally a fallback spinner

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
      <Lottie
        animationData={animationData}
        loop={true}
        className="w-96 h-96 mb-6 max-w-full max-h-[80vh]"
      />
      <p className="text-white font-semibold text-2xl animate-pulse">
        Se încarcă proiectele...
      </p>
    </div>
  );
};

export default SpinnerOverlay;
