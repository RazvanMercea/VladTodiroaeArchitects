import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db, auth, storage } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {Phone,Mail,X,Plus,Trash2,} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import {CATEGORIES,ROOM_TYPES,} from "@/lib/constants";
import {CATEGORY_FLOOR_RULES,ALL_FLOORS,} from "@/lib/helpers";
import { validateProject } from "@/lib/projectValidation";
import {updateProjectInDatabase,deleteProjectFromDatabase,} from "@/lib/projectService";
import { collection, getDocs } from "firebase/firestore";

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const EditProjectPage = () => {
  const router = useRouter();
  const { title } = router.query;

  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState(null);

  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState(CATEGORIES[0]);
  const [projectPrice, setProjectPrice] = useState("");
  const [totalMP, setTotalMP] = useState("");
  const [usableMP, setUsableMP] = useState("");
  const [images, setImages] = useState([]);
  const [plans, setPlans] = useState({});
  const [floors, setFloors] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [internalId, setInternalId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(storedUser);
    setLoggedUser(user);
    if (user.email !== ADMIN_EMAIL) {
      toast.error("Nu aveți permisiunea să editați proiecte.");
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (!title) return;

    const fetchProject = async () => {
        try {
        const snapshot = await getDocs(collection(db, "projects"));
        const projectData = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .find((p) => p.name === title);

        if (!projectData) {
            toast.error("Proiectul nu a fost găsit.");
            router.push("/");
            return;
        }

        setProjectId(projectData.docId);
        setInternalId(projectData.id);
        setProjectName(projectData.name);
        setProjectCategory(projectData.category);
        setProjectPrice(projectData.price);
        setTotalMP(projectData.totalMP);
        setUsableMP(projectData.usableMP);

        setImages(projectData.images.map((url) => ({ url })));
        setFloors(projectData.floors || []);

        const plansObj = {};
        for (const floor in projectData.plans) {
            plansObj[floor] = { url: projectData.plans[floor] };
        }
        setPlans(plansObj);
        } catch (err) {
        console.error(err);
        toast.error("Eroare la încărcarea proiectului.");
        router.push("/");
        } finally {
        setLoading(false);
        }
    };

    fetchProject();
    }, [title]);

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

  if (loading) return <SpinnerOverlay />;

  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.removeItem("loggedUser");
      setLoggedUser(null);
      router.push("/");
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files
      .filter(
        (file) =>
          !images.some((img) => img.file?.name === file.name)
      )
      .map((file) => ({ file, url: URL.createObjectURL(file) }));

    if (newFiles.length === 0) {
      toast.error("Imaginile selectate există deja.");
      return;
    }

    setImages([...images, ...newFiles]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

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
      CATEGORY_FLOOR_RULES[projectCategory].defaultFloors.includes(floor.type)
    ) {
      toast.error(`Etajul "${floor.type}" nu poate fi șters.`);
      return;
    }
    setFloors(floors.filter((_, i) => i !== floorIndex));
  };

  const availableFloors = ALL_FLOORS.filter(
    (f) =>
      !floors.some((floor) => floor.type === f) &&
      !CATEGORY_FLOOR_RULES[projectCategory].disabledOptions.includes(f)
  );

  const handleUpdateProject = async () => {
    if (
      !validateProject(
        projectName,
        images,
        projectPrice,
        totalMP,
        usableMP,
        floors,
        plans
      )
    ) {
      toast.error("Completați toate câmpurile corect!");
      return;
    }

    setLoading(true);
    const updatedProject = {
      name: projectName,
      category: projectCategory,
      price: Number(projectPrice),
      totalMP: Number(totalMP),
      usableMP: Number(usableMP),
      floors,
      images,
      plans,
    };

    const result = await updateProjectInDatabase(projectId, updatedProject);

    setLoading(false);
    if (result.success) {
      toast.success("Proiectul a fost actualizat cu succes!");
      router.push(`/project-details?title=${projectName}`);
    } else {
      toast.error("Eroare la actualizare proiect.");
    }
  };

  const handleDeleteProject = () => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold mb-3">
            Doriți să ștergeți proiectul?
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setLoading(true);
                const result = await deleteProjectFromDatabase(projectId);
                setLoading(false);
                if (result.success) {
                  toast.success("Proiect șters cu succes!");
                  router.push("/");
                } else {
                  toast.error("Eroare la ștergerea proiectului.");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
            >
              Da
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-3 rounded-lg"
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
      <Toaster position="top-right" />
      {loading && <SpinnerOverlay />}

      {/* Top Band */}
      <div
        className="fixed w-full h-12 z-50 flex justify-between items-center px-6 text-sm text-white shadow-md"
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
            className="text-white hover:text-gray-300 transition"
          >
            Home
          </button>
          <button
            onClick={handleLogout}
            className="text-white hover:text-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-auto px-6 py-8 space-y-10 pt-16 relative z-0">
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

        {/* General Info */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Informații generale
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
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
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

          {/* Price & MP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Compartimentare */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            Compartimentare
          </h2>

          <div className="flex items-center gap-2 mb-4">
            <select
              value=""
              onChange={(e) => {
                const floorType = e.target.value;
                if (floorType) setFloors([...floors, { type: floorType, rooms: [] }]);
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
                className="mt-2 flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
              >
                <Plus size={16} /> Adaugă Cameră
              </button>
            </div>
          ))}
        </div>

        {/* PLANSE */}
        <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Planșe</h2>
          <p className="text-gray-600 mb-2 text-sm italic">
            Încarcă sau înlocuiește planurile fiecărui etaj (planuri arhitecturale, tehnice etc.)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {floors.map((floor) => (
              <div
                key={floor.type}
                className="border border-gray-300 p-4 rounded-lg bg-gray-50 flex flex-col items-center"
              >
                <h3 className="font-semibold text-gray-700 mb-2">{floor.type}</h3>
                <label className="cursor-pointer text-blue-600 underline text-sm mb-2">
                  Alege planșă
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setPlans({
                        ...plans,
                        [floor.type]: { file, url: URL.createObjectURL(file) },
                      });
                    }}
                    className="hidden"
                  />
                </label>
                {plans[floor.type]?.url && (
                  <div className="relative w-full h-40 mt-2 border border-gray-400 rounded-md overflow-hidden">
                    <img
                      src={plans[floor.type].url}
                      alt={`Plan ${floor.type}`}
                      className="w-full h-full object-cover"
                      onClick={() => setPreviewImage(plans[floor.type].url)}
                    />
                    <button
                      onClick={() => {
                        const updatedPlans = { ...plans };
                        delete updatedPlans[floor.type];
                        setPlans(updatedPlans);
                      }}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={handleUpdateProject}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Actualizare proiect
          </button>
          <button
            onClick={handleDeleteProject}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Ștergere proiect
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-[#3D3B3B] text-white py-6 mt-auto">
        <div className="flex flex-col md:flex-row justify-start md:justify-between items-center px-6 text-sm space-y-3 md:space-y-0">
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

      {/* IMAGE PREVIEW OVERLAY */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-w-3xl max-h-[90vh] object-contain rounded-lg shadow-lg"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 bg-red-600 text-white p-2 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditProjectPage;

