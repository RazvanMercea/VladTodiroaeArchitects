import React from "react";
import { db } from "@/lib/firebase";
import { Phone, Mail } from "lucide-react";

// Contact info
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

// Card data
const CARD_DATA = [
  {
    image: "/constructions.jpeg",
    text: "Proiecte case parter",
  },
  {
    image: "/plans.jpeg",
    text: "Planuri case etaj",
  },
  {
    image: "/icon.jpeg",
    text: "Proiecte Case cu Mansarda",
  },
];

const MainPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Top band */}
      <div
        className="w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md"
        style={{ backgroundColor: "#3D3B3B" }}
      >
        {/* Contact info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>{CONTACT_PHONE}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>{CONTACT_EMAIL}</span>
          </div>
        </div>

        {/* Login */}
        <button className="text-white font-semibold hover:text-gray-300 transition">
          Login
        </button>
      </div>

      {/* Header */}
      <div className="relative h-[350px] w-full shadow-lg">
        <img
          src="/header_image.jpeg"
          alt="Header Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <img
            src="/icon.jpeg"
            alt="Logo"
            className="w-20 h-20 rounded-full mb-4 border-2 border-white object-cover shadow-md"
          />
          <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
            Vlad Todiroaie Architects +
          </h1>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6 mt-10 px-4">
        {CARD_DATA.map((card, index) => (
          <div
            key={index}
            className="max-w-sm w-full bg-[#3D3B3B] rounded-lg shadow-lg overflow-hidden text-center p-4 
                       transform transition duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-white text-xl font-semibold mb-3">{card.text}</div>
            <div className="overflow-hidden rounded-lg">
              <img
                src={card.image}
                alt={card.text}
                className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainPage;

