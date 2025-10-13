import { useEffect } from "react";
import { db } from "@/lib/firebase";
import React from "react";

const MainPage = () => {
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
        {/* Background Image */}
        <img
          src="/header_image.jpeg"
          alt="Header Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/25"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {/* Logo Icon */}
          <img
            src="/icon.jpeg"
            alt="Logo"
            className="w-20 h-20 rounded-full mb-4 border-2 border-white object-cover"
          />

          {/* Title */}
          <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
            Vlad Todiroaie Architects +
          </h1>
        </div>
      </div>
    </div>
  );
};

export default MainPage;