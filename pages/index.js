import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Phone, Mail } from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const CARD_DATA = [
  { image: "/constructions.jpeg", text: "Proiecte Case Parter" },
  { image: "/plans.jpeg", text: "Proiecte Case Etaj" },
  { image: "/icon.jpeg", text: "Proiecte Case Mansarda" },
];

const MainPage = () => {
  const router = useRouter();
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold mb-3">Sigur doriți să vă delogați?</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                signOut(auth)
                  .then(() => {
                    localStorage.removeItem("loggedUser");
                    setLoggedUser(null);
                    toast.dismiss(t.id);
                    toast.success("V-ați delogat cu succes!");
                  })
                  .catch(() => toast.error("A apărut o eroare la delogare."));
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg transition"
            >
              Da
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded-lg transition"
            >
              Nu
            </button>
          </div>
        </div>
      ),
      { duration: 4000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top band */}
      <div
        className="w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md"
        style={{ backgroundColor: "#3D3B3B" }}
      >
        {/* Left side: logged-in user email */}
        <div className="flex items-center gap-2">
          {loggedUser && (
            <span className="font-semibold text-white">
              Conectat ca: {loggedUser.email}
            </span>
          )}
        </div>

        {/* Right side: Home + Login/Logout */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-white font-semibold hover:text-gray-300 transition"
          >
            Home
          </button>

          {!loggedUser ? (
            <button
              onClick={() => router.push("/login")}
              className="text-white font-semibold hover:text-gray-300 transition"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="text-white font-semibold hover:text-gray-300 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Main content area (flex-grow ensures footer sticks to bottom) */}
      <div className="flex-grow">
        {/* Header */}
        <div className="relative h-[350px] w-full shadow-lg">
          <img
            src="/header_image.jpeg"
            alt="Header Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <img
              src="/icon.jpeg"
              alt="Logo"
              className="w-20 h-20 rounded-full mb-4 border-2 border-white object-cover shadow-md"
            />
            <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
              Vlad Todiroae Architects +
            </h1>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 px-4 pb-10">
          {CARD_DATA.map((card, index) => (
            <div
              key={index}
              className="max-w-sm w-full bg-[#3D3B3B] rounded-lg shadow-lg overflow-hidden text-center p-4 transform transition duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="text-white text-xl font-semibold mb-3">
                {card.text}
              </div>
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

      {/* Bottom Band */}
      <footer
        className="w-full h-10 flex justify-end items-center px-6 text-sm text-white shadow-md"
        style={{ backgroundColor: "#3D3B3B" }}
      >
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
      </footer>
    </div>
  );
};

export default MainPage;
