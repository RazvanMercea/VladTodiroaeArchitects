import React, { useState, useEffect } from "react";
import { Phone, Mail, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";

// Contact info
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Va rugam introduceti emailul si parola.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Store the logged-in user in localStorage
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      };
      localStorage.setItem("loggedUser", JSON.stringify(userData));
      setLoggedUser(userData);

      toast.success("Login reusit!");
      setError("");

      router.push("/"); // Redirect to main page
    } catch (err) {
      console.error("Login nereusit:", err);
      toast.error("Email-ul sau parola incorecte.");
    }
  };

  // Disable inputs if already logged in
  const isDisabled = !!loggedUser;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top band */}
      <div
        className="w-full h-12 flex justify-end items-center px-6 text-sm text-white shadow-md"
        style={{ backgroundColor: "#3D3B3B" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-white font-semibold hover:text-gray-300 transition"
          >
            Home
          </button>
          <button
            className="text-white font-semibold hover:text-gray-300 transition"
          >
            Login
          </button>
        </div>
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
          {loggedUser && (
            <p className="text-white mt-2 text-lg">
              Sunteti conectat ca: <span className="font-semibold">{loggedUser.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Login form section */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-100 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Login
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-center font-semibold">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={loggedUser ? loggedUser.email : email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                isDisabled ? "bg-gray-200 cursor-not-allowed opacity-50" : ""
              }`}
              placeholder="Enter your email"
              disabled={isDisabled}
            />
          </div>

          <div className="mb-6 relative">
            <label className="block mb-1 font-semibold text-gray-700">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 pr-10 ${
                isDisabled ? "bg-gray-200 cursor-not-allowed opacity-50" : ""
              }`}
              placeholder="Enter your password"
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={isDisabled}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            onClick={handleLogin}
            className={`w-full bg-[#3D3B3B] text-white font-semibold py-2 rounded-md hover:bg-gray-600 transition ${
              isDisabled ? "opacity-50 cursor-not-allowed hover:bg-[#3D3B3B]" : ""
            }`}
            disabled={isDisabled}
          >
            Login
          </button>
        </div>
      </div>

      {/* Bottom Band */}
      <div
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
      </div>
    </div>
  );
};

export default LoginPage;
