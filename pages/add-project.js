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

  // Image Upload Logic
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

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Compartimentare Logic
  const addRoom = (floorIndex) => {
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? { ...f, rooms: [...f.rooms, { roomType: ROOM_TYPES[0], mp: "" }] }
          : f
      )
    );
  };

  const removeRoom = (floorIndex, roomIndex) => {
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? { ...f, rooms: f.rooms.filter((_, idx) => idx !== roomIndex) }
          : f
      )
    );
  };

  const updateRoom = (floorIndex, roomIndex, field, value) => {
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
  };

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

  // ✅ Missing Functions Added:
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
        {/* === Fields (name, category, price, etc.) === */}
        {/* Keep your full content from before — all your inputs, images, floors, and plans */}

        {/* ✅ Bottom Buttons */}
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
