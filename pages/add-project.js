import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Phone, Mail, X, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import SectionWrapper from "@/components/SectionWrapper";
import { CATEGORIES, ROOM_TYPES } from "@/lib/constants";
import { getDefaultFloorsForCategory, filterAvailableFloors } from "@/lib/helpers";

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const AddProjectPage = () => {
  const router = useRouter();
  const [loggedUser, setLoggedUser] = useState(null);

  // Project fields
  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState(CATEGORIES[0]);
  const [projectPrice, setProjectPrice] = useState("");
  const [totalMP, setTotalMP] = useState("");
  const [usableMP, setUsableMP] = useState("");
  const [images, setImages] = useState([]);

  // Compartimentare
  const [floors, setFloors] = useState([]);

  // Section control
  const [activeSection, setActiveSection] = useState("informatii");
  const [sectionsCompleted, setSectionsCompleted] = useState({
    informatii: false,
    compartimentare: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

  // Set default floors based on category
  useEffect(() => {
    const defaultFloors = getDefaultFloorsForCategory(projectCategory);
    setFloors(defaultFloors.map((type) => ({ type, rooms: [] })));
  }, [projectCategory]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    let newFiles = [];

    files.forEach((file) => {
      if (images.some((img) => img.file?.name === file.name)) {
        toast.error(`Imaginea "${file.name}" a fost deja adăugată.`);
      } else {
        newFiles.push({ file, url: URL.createObjectURL(file) });
      }
    });

    if (newFiles.length) setImages((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  // Floors logic
  const addRoom = (floorIndex) => {
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? { ...f, rooms: [...f.rooms, { roomType: ROOM_TYPES[0], mp: "" }] }
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

  const removeRoom = (floorIndex, roomIndex) => {
    setFloors(
      floors.map((f, i) =>
        i === floorIndex
          ? { ...f, rooms: f.rooms.filter((_, idx) => idx !== roomIndex) }
          : f
      )
    );
  };

  const availableFloors = filterAvailableFloors(
    ["Parter", "Etaj 1", "Etaj 2", "Etaj 3", "Mansarda", "Subsol"],
    floors.map((f) => f.type)
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top band omitted for brevity */}

      <div className="flex-grow px-6 py-8 space-y-10">
        {/* Informatii generale Section */}
        <SectionWrapper
          title="Informatii generale"
          isActive={activeSection === "informatii"}
          isComplete={sectionsCompleted.informatii}
          onComplete={() => {
            if (
              !projectName ||
              !projectCategory ||
              !projectPrice ||
              !totalMP ||
              !usableMP ||
              images.length === 0
            )
              return false;
            setSectionsCompleted((prev) => ({ ...prev, informatii: true }));
            setActiveSection("compartimentare");
            return true;
          }}
        >
          <div className="space-y-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Numele proiectului"
              className="w-full border border-gray-400 rounded-md px-4 py-2"
            />
            <select
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)}
              className="w-full border border-gray-400 rounded-md px-3 py-2"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={projectPrice}
              onChange={(e) => setProjectPrice(e.target.value)}
              placeholder="Pret Proiect (€)"
              className="w-full border border-gray-400 rounded-md px-4 py-2"
            />
            <input
              type="number"
              value={totalMP}
              onChange={(e) => setTotalMP(e.target.value)}
              placeholder="Metri pătrați totali"
              className="w-full border border-gray-400 rounded-md px-4 py-2"
            />
            <input
              type="number"
              value={usableMP}
              onChange={(e) => setUsableMP(e.target.value)}
              placeholder="Metri pătrați utili"
              className="w-full border border-gray-400 rounded-md px-4 py-2"
            />

            <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer">
              Browse Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-32 h-32 border rounded-md overflow-hidden">
                  <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </SectionWrapper>

        {/* Compartimentare Section */}
        <SectionWrapper
          title="Compartimentare"
          isActive={activeSection === "compartimentare"}
          isComplete={sectionsCompleted.compartimentare}
          onComplete={() => {
            if (floors.some((f) => f.rooms.length === 0)) return false;
            setSectionsCompleted((prev) => ({ ...prev, compartimentare: true }));
            return true;
          }}
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value=""
                onChange={(e) => {
                  const floorType = e.target.value;
                  if (floorType) setFloors([...floors, { type: floorType, rooms: [] }]);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
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
              <div key={floorIndex} className="border p-4 rounded-md bg-gray-100 space-y-2">
                <h3 className="font-semibold">{floor.type}</h3>
                {floor.rooms.map((room, roomIndex) => (
                  <div key={roomIndex} className="flex gap-2 items-center">
                    <select
                      value={room.roomType}
                      onChange={(e) =>
                        updateRoom(floorIndex, roomIndex, "roomType", e.target.value)
                      }
                      className="border px-2 py-1 rounded-md"
                    >
                      {ROOM_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={room.mp}
                      onChange={(e) =>
                        updateRoom(floorIndex, roomIndex, "mp", e.target.value)
                      }
                      placeholder="mp"
                      className="border px-2 py-1 rounded-md"
                    />
                    <button
                      onClick={() => removeRoom(floorIndex, roomIndex)}
                      className="text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addRoom(floorIndex)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg"
                >
                  <Plus size={14} />
                  Adaugă Cameră
                </button>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </div>
    </div>
  );
};

export default AddProjectPage;
