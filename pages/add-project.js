import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Phone, Mail, X, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { CATEGORIES, ROOM_TYPES } from "@/lib/constants";
import { CATEGORY_FLOOR_RULES, ALL_FLOORS } from "@/lib/helpers";
import { validateProject } from "@/lib/projectValidation";
import { addProjectToDatabase } from "@/lib/projectService";
import { v4 as uuidv4 } from "uuid";
import SpinnerOverlay from "@/components/SpinnerOverlay";

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const AddProjectPage = () => {
  const router = useRouter();
  const [loggedUser, setLoggedUser] = useState(null);

  const [loading, setLoading] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState(CATEGORIES[0]);
  const [projectPrice, setProjectPrice] = useState("");
  const [totalMP, setTotalMP] = useState("");
  const [usableMP, setUsableMP] = useState("");
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const [floors, setFloors] = useState([]); // {type, rooms: [{roomType, mp}]}
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
                  .catch(() =>
                    toast.error("A apărut o eroare la delogare.")
                  );
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

  // Images
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

  // Compartimentare actions
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {loading && <SpinnerOverlay />}
      {/* Top Band */}
      <div
        className="fixed w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md"
        style={{ backgroundColor: "#3D3B3B" }}
      >
        <div className="flex items-center gap-2">
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
      <div className="flex-grow overflow-auto px-6 py-8 space-y-10">
        {/* Project Title */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 pt-16">
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
          {/* Categoria */}
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

          {/* Images */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              Imagini Proiect
            </label>
            <label className="inline-block mb-2 cursor-pointer text-blue-800 italic underline">
              Browse Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <span className="ml-4 font-medium text-gray-700">
              {images.length} image{images.length !== 1 ? "s" : ""} selected
            </span>

            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-32 h-32 flex-shrink-0 border border-gray-400 rounded-md overflow-hidden cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onClick={() => setPreviewImage(img.url)}
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              Pret Proiect (€)
            </label>
            <input
              type="number"
              value={projectPrice}
              onChange={(e) => setProjectPrice(e.target.value)}
              className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          {/* Total MP */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              Metri pătrați totali
            </label>
            <input
              type="number"
              step="0.1"
              value={totalMP}
              onChange={(e) => setTotalMP(e.target.value)}
              className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          {/* Usable MP */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">
              Metri pătrați utili
            </label>
            <input
              type="number"
              step="0.1"
              value={usableMP}
              onChange={(e) => setUsableMP(e.target.value)}
              className="w-full border border-gray-400 bg-gray-100 text-gray-800 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Compartimentare */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Compartimentare
          </h2>

          {/* Floor selection */}
          <div className="flex items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const floorType = e.target.value;
                if (floorType) {
                  setFloors([...floors, { type: floorType, rooms: [] }]);
                }
              }}
              className={`px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500
                bg-green-600 text-white hover:bg-green-700
                ${availableFloors.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
              `}
              disabled={availableFloors.length === 0}
            >
              <option value="" disabled>
                + Adaugă Etaj
              </option>
              {availableFloors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {floors.map((floor, floorIndex) => (
            <div
              key={floorIndex}
              className="border border-gray-400 p-4 rounded-md space-y-2 bg-gray-100 relative"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">{floor.type}</h3>
                <button
                  onClick={() => removeFloor(floorIndex)}
                  className={`text-red-600 hover:text-red-800 ${
                    CATEGORY_FLOOR_RULES[projectCategory].defaultFloors.includes(
                      floor.type
                    )
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={CATEGORY_FLOOR_RULES[projectCategory].defaultFloors.includes(
                    floor.type
                  )}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Rooms Table */}
              <table className="w-full text-gray-800">
                <thead>
                  <tr>
                    <th className="border-b px-2 py-1 text-left">Camera</th>
                    <th className="border-b px-2 py-1 text-left">Suprafață (mp)</th>
                    <th className="border-b px-2 py-1">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {floor.rooms.map((room, roomIndex) => (
                    <tr key={roomIndex}>
                      <td className="border-b px-2 py-1">
                        <select
                          value={room.roomType}
                          onChange={(e) =>
                            updateRoom(floorIndex, roomIndex, "roomType", e.target.value)
                          }
                          className="w-full border border-gray-400 rounded-md px-2 py-1"
                        >
                          {ROOM_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b px-2 py-1">
                        <input
                          type="number"
                          value={room.mp}
                          onChange={(e) =>
                            updateRoom(floorIndex, roomIndex, "mp", e.target.value)
                          }
                          className="w-full border border-gray-400 rounded-md px-2 py-1"
                        />
                      </td>
                      <td className="border-b px-2 py-1 text-center">
                        <button
                          onClick={() => removeRoom(floorIndex, roomIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() => addRoom(floorIndex)}
                className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={14} />
                Adaugă Cameră
              </button>
            </div>
          ))}
        </div>

        {/* Planuri */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Planuri</h2>
          <p className="text-sm text-gray-600 mb-2">
            Incarcati o singura imagine per etaj
          </p>

          {floors.map((floor, floorIndex) => (
            <div
              key={floorIndex}
              className="border border-gray-400 p-4 rounded-md space-y-2 bg-gray-100 relative"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-800">Plan - {floor.type}:</span>

                <label className="inline-block px-0 py-0 cursor-pointer text-blue-800 italic underline">
                  Upload Plan
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (!e.target.files.length) return;

                      if (plans[floor.type]) {
                        toast.error("Poti incarca doar o imagine per etaj.");
                        return;
                      }

                      const file = e.target.files[0];
                      setPlans((prev) => ({
                        ...prev,
                        [floor.type]: { file, url: URL.createObjectURL(file) },
                      }));
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {plans[floor.type] && (
                  <div className="relative w-32 h-32 border border-gray-400 rounded-md overflow-hidden cursor-pointer">
                    <img
                      src={plans[floor.type].url}
                      alt="Plan preview"
                      className="w-full h-full object-cover"
                      onClick={() => setPreviewImage(plans[floor.type].url)}
                    />
                    <button
                      onClick={() =>
                        setPlans((prev) => {
                          const newPlans = { ...prev };
                          delete newPlans[floor.type];
                          return newPlans;
                        })
                      }
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-6 my-6 pb-24">
        <button
          onClick={() =>
            toast(
              (t) => (
                <div className="text-center">
                  <p className="font-semibold mb-3">Abandonati planul?</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        router.push("/"); // revine la main page
                      }}
                      className="bg-[#3D3B3B] hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
                    >
                      Da
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="bg-gray-300 hover:bg-gray-400 text-black font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
                    >
                      Nu
                    </button>
                  </div>
                </div>
              ),
              { duration: 4000 }
            )
          }
          className="bg-[#3D3B3B] hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
        >
          Anulați
        </button>

        <button
            onClick={async () => {
                const isValid = validateProject(
                projectName,
                images,
                projectPrice,
                totalMP,
                usableMP,
                floors,
                plans
                );

                if (!isValid) {
                toast.error("Vă rugăm completați toate câmpurile!");
                return;
                }

                setLoading(true);

                // Build object
                const projectData = {
                id: uuidv4(),
                name: projectName,
                category: projectCategory,
                price: Number(projectPrice),
                totalMP: Number(totalMP),
                usableMP: Number(usableMP),
                floors,
                createdBy: loggedUser?.email || "unknown",
                createdAt: new Date().toISOString(),
                images,
                plans
                };

                const result = await addProjectToDatabase(projectData);

                setLoading(false);

                if (result.success) {
                toast.success("Proiect adăugat cu succes!");
                router.push("/");
                } else {
                toast.error("A apărut o eroare la adăugarea proiectului.");
                }
            }}
            className="bg-[#3D3B3B] hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
            >
            Adăugare proiect
        </button>
      </div>

      {/* Image Preview Popup */}
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

      {/* Bottom Band */}
      <footer
        className="fixed bottom-0 left-0 w-full h-10 flex justify-end items-center px-6 text-sm text-white shadow-md"
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
