import { useEffect } from "react";
import { db } from "@/lib/firebase";
import React from "react";

const MainPage = () => {
  // Card data
  const cards = [
    {
      image: "/constructions.jpeg",
      text: "Proiecte construite",
    },
    {
      image: "/plans.jpg",
      text: "Planuri tipizate",
    },
    {
      image: "/icon.jpeg",
      text: "Despre noi",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top band */}
      <div
        className="w-full h-10 flex justify-end items-center px-6"
        style={{ backgroundColor: "#3D3B3B" }}
      >
        <button className="text-white font-semibold hover:text-gray-300">
          Login
        </button>
      </div>

      {/* Header / Hero Section */}
      <div className="relative h-[350px] w-full">
        <img
          src="/header_image.jpeg"
          alt="Header Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <img
            src="/icon.jpeg"
            alt="Logo"
            className="w-20 h-20 rounded-full mb-4 border-2 border-white object-cover"
          />
          <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
            Vlad Todiroaie Architects +
          </h1>
        </div>
      </div>

      {/* Three Cards Section */}
      <div className="flex flex-wrap justify-center gap-6 mt-10 px-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="max-w-sm w-full bg-[#3D3B3B] rounded-lg shadow-lg overflow-hidden text-center"
          >
            <div className="py-4 text-white text-xl font-semibold">{card.text}</div>
            <img
              src={card.image}
              alt={card.text}
              className="w-full h-64 object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainPage;