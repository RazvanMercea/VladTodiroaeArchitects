import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Phone, Mail, X, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { CATEGORIES, ROOM_TYPES } from "@/lib/constants";
import { CATEGORY_FLOOR_RULES, ALL_FLOORS } from "@/lib/helpers";

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const AddProjectPage = () => {
  const router = useRouter();
  const [loggedUser, setLoggedUser] = useState(null);

  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState(CATEGORIES[0]);
  const [projectPrice, setProjectPrice] = useState("");
  const [totalMP, setTotalMP] = useState("");
  const [usableMP, setUsableMP] = useState("");
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [floors, setFloors] = useState([]);
  const [plans, setPlans] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const rule = CATEGORY_FLOOR_RULES[projectCategory];
    setFloors((prev) => {
      const newFloors = rule.defaultFloors.map((floor) => {
        const existing = prev.find((f) => f.type === floor);
        return existing || { type: floor, rooms: [] };
      });
      return newFloors;
    });
  }, [projectCategory]);

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
                    router.push("/");
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    let newFiles = [];
    files.forEach((file) => {
      if (images.some((img) => img.file.name === file.name)) {
        toast.error(`Imaginea "${file.name}" a fost deja adăugată.`);
      } else {
        newFiles.push({ file, url: URL.createObjectURL(file) });
      }
    });
    if (newFiles.length) setImages((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const addRoom = (floorIndex) =>
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? { ...f, rooms: [...f.rooms, { roomType: ROOM_TYPES[0], mp: "" }] }
          : f
      )
    );

  const removeRoom = (floorIndex, roomIndex) =>
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? { ...f, rooms: f.rooms.filter((_, idx) => idx !== roomIndex) }
          : f
      )
    );

  const updateRoom = (floorIndex, roomIndex, field, value) =>
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? {
              ...f,
              rooms: f.rooms.map((r, idx) =>
                idx === roomIndex ? { ...r, [field]: value } : r
              ),
            }
          : f
      )
    );

  const removeFloor = (floorIndex) => {
    const floor = floors[floorIndex];
    if (
      floor.type === "Parter" &&
      CATEGORY_FLOOR_RULES[projectCategory].defaultFloors.includes("Parter")
    ) {
      toast.error("Etajul 'Parter' nu poate fi șters.");
      return;
    }
    setFloors(floors.filter((_, i) => i !== floorIndex));
  };

  const availableFloors = ALL_FLOORS.filter(
    (f) =>
      !floors.some((floor) => floor.type === f) &&
      !CATEGORY_FLOOR_RULES[projectCategory].disabledOptions.includes(f)
  );

  const handleCancel = () => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold mb-3">Abandonați planul?</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                router.push("/");
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

  const handleAddProject = () => {
    toast.success("Proiectul a fost adăugat cu succes! (logica urmează)");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div
        className="w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md"
        style={{ backgroundColor: "#3D3B3B" }}
      >
        <div>
          {loggedUser && (
            <span className="font-semibold text-white">
              Conectat ca: {loggedUser.email}
            </span>
          )}
        </div>
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

      {/* Main Content */}
      <div className="flex-grow px-6 py-8 space-y-10">
        {/* Project Name */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Numele Proiectului
          </h2>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Introduceți numele proiectului"
            className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        {/* Informatii generale */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Informatii generale
          </h2>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              Categoria Proiectului
            </label>
            <select
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)}
              className="w-full border border-gray-400 bg-white text-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {CATEGORIES.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {/* Price */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Pret Proiect (€)</label>
            <input
              type="number"
              value={projectPrice}
              onChange={(e) => setProjectPrice(e.target.value)}
              className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          {/* Total & Usable MP */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-1 font-semibold text-gray-700">Metri pătrați totali</label>
              <input
                type="number"
                step="0.1"
                value={totalMP}
                onChange={(e) => setTotalMP(e.target.value)}
                className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-semibold text-gray-700">Metri pătrați utili</label>
              <input
                type="number"
                step="0.1"
                value={usableMP}
                onChange={(e) => setUsableMP(e.target.value)}
                className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Imagini Proiect</label>
            <label className="italic underline text-blue-800 cursor-pointer hover:text-blue-600 transition">
              Browse Images
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <span className="ml-4 font-medium text-gray-700">{images.length} image{images.length !== 1 && "s"} selected</span>
            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-32 h-32 flex-shrink-0 border border-gray-400 rounded-md overflow-hidden cursor-pointer">
                  <img src={img.url} alt="preview" className="w-full h-full object-cover" onClick={() => setPreviewImage(img.url)} />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 rounded-full p-1 text-white hover:bg-red-700 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floors / Compartimentare */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-6">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Compartimentare</h2>
          {floors.map((floor, fIdx) => (
            <div key={fIdx} className="border border-gray-300 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">{floor.type}</h3>
                <div className="flex gap-2">
                  <button onClick={() => addRoom(fIdx)} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => removeFloor(fIdx)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {floor.rooms.map((room, rIdx) => (
                  <div key={rIdx} className="flex gap-2 items-center">
                    <select
                      value={room.roomType}
                      onChange={(e) => updateRoom(fIdx, rIdx, "roomType", e.target.value)}
                      className="border border-gray-400 rounded-md px-2 py-1"
                    >
                      {ROOM_TYPES.map((type, i) => (
                        <option key={i} value={type}>{type}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="MP"
                      value={room.mp}
                      onChange={(e) => updateRoom(fIdx, rIdx, "mp", e.target.value)}
                      className="border border-gray-400 rounded-md px-2 py-1 w-24"
                    />
                    <button onClick={() => removeRoom(fIdx, rIdx)} className="text-red-600 hover:text-red-800 transition">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-6 mt-10">
          <button
            onClick={handleCancel}
            className="bg-[#3D3B3B] hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
          >
            Anulați
          </button>
          <button
            onClick={handleAddProject}
            className="bg-[#3D3B3B] hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
          >
            Adaugă Proiect
          </button>
        </div>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Footer */}
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

export default AddProjectPage;
