import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProjectInDatabase, deleteProjectFromDatabase } from "@/lib/projectService";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast, { Toaster } from "react-hot-toast";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import { X, Plus, Trash2, Phone, Mail } from "lucide-react";
import { CATEGORIES, ROOM_TYPES } from "@/lib/constants";
import { CATEGORY_FLOOR_RULES, ALL_FLOORS } from "@/lib/helpers";
import { validateProject } from "@/lib/projectValidation";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const uploadFileToStorage = async (storage, file, path) => {
  const storageRef = ref(storage, `${path}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

const EditProject = ({ storage }) => {
  const router = useRouter();
  const { id } = router.query;

  const [loggedUser, setLoggedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState(CATEGORIES[0]);
  const [projectPrice, setProjectPrice] = useState("");
  const [totalMP, setTotalMP] = useState("");
  const [usableMP, setUsableMP] = useState("");
  const [images, setImages] = useState([]);
  const [floors, setFloors] = useState([]);
  const [plans, setPlans] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const fetchProject = async () => {
      try {
        const docRef = doc(db, "projects", id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          toast.error("Proiectul nu a fost găsit.");
          router.push("/");
          return;
        }
        const data = snap.data();
        setProjectName(data.name || "");
        setProjectCategory(data.category || CATEGORIES[0]);
        setProjectPrice(data.price || "");
        setTotalMP(data.totalMP || "");
        setUsableMP(data.usableMP || "");
        setImages((data.images || []).map(url => ({ url })));
        setPlans(
          Object.keys(data.plans || {}).reduce(
            (acc, key) => ({ ...acc, [key]: { url: data.plans[key] } }),
            {}
          )
        );
        setFloors(data.floors || []);
      } catch (error) {
        console.error(error);
        toast.error("Eroare la încărcarea proiectului.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [router.isReady, id]);

    useEffect(() => {
    if (floors.length > 0) return;
    const rule = CATEGORY_FLOOR_RULES[projectCategory] || { defaultFloors: [] };
    const defaultFloors = rule.defaultFloors.map(floor => ({ type: floor, rooms: [] }));
    setFloors(defaultFloors);
    }, [projectCategory, floors]);

  if (!router.isReady || !loggedUser || loading) return <SpinnerOverlay />;
  if (loggedUser.email !== ADMIN_EMAIL)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-700">Acces interzis</h2>
      </div>
    );

  // Handlers
  const handleLogout = () => {
    toast(t => (
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
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg"
          >
            Da
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded-lg">
            Nu
          </button>
        </div>
      </div>
    ));
  };

  const handleImageUpload = e => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    setImages([...images, ...newFiles]);
    e.target.value = "";
  };
  const removeImage = index => setImages(images.filter((_, i) => i !== index));

  const addRoom = floorIndex => {
    setFloors(floors.map((f, i) => i === floorIndex ? { ...f, rooms: [...f.rooms, { roomType: ROOM_TYPES[0], mp: "" }] } : f));
  };
  const removeRoom = (floorIndex, roomIndex) => {
    setFloors(floors.map((f, i) => i === floorIndex ? { ...f, rooms: f.rooms.filter((_, idx) => idx !== roomIndex) } : f));
  };
  const updateRoom = (floorIndex, roomIndex, field, value) => {
    setFloors(floors.map((f, i) => i === floorIndex ? { ...f, rooms: f.rooms.map((r, idx) => idx === roomIndex ? { ...r, [field]: value } : r) } : f));
  };
  const removeFloor = floorIndex => {
    const floor = floors[floorIndex];
    if (CATEGORY_FLOOR_RULES[projectCategory].defaultFloors.includes(floor.type)) {
      toast.error(`Etajul '${floor.type}' nu poate fi șters.`);
      return;
    }
    setFloors(floors.filter((_, i) => i !== floorIndex));
  };

  const availableFloors = ALL_FLOORS.filter(
    f => !floors.some(floor => floor.type === f) && !CATEGORY_FLOOR_RULES[projectCategory].disabledOptions.includes(f)
  );

  const handlePlanUpload = (e, floorType) => {
    const file = e.target.files[0];
    if (!file) return;
    setPlans({ ...plans, [floorType]: { file, url: URL.createObjectURL(file) } });
    e.target.value = "";
  };

  const handleDeleteProject = () => {
    toast(t => (
      <div className="text-center">
        <p className="font-semibold mb-3">Sunteți sigur că ștergeți proiectul?</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const res = await deleteProjectFromDatabase(id);
              if (res.success) {
                toast.success("Proiect șters cu succes!");
                router.push("/");
              } else toast.error("Eroare la ștergere.");
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg"
          >
            Da
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded-lg">
            Nu
          </button>
        </div>
      </div>
    ));
  };

  const handleUpdateProject = async () => {
    if (!validateProject(projectName, images, projectPrice, totalMP, usableMP, floors, plans)) {
      toast.error("Vă rugăm completați toate câmpurile!");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedImages = await Promise.all(
        images.map(img => (img.file ? uploadFileToStorage(storage, img.file, `projects/${id}/images`) : img.url))
      );

      const uploadedPlans = {};
      for (const [floor, plan] of Object.entries(plans)) {
        uploadedPlans[floor] = plan.file ? await uploadFileToStorage(storage, plan.file, `projects/${id}/plans`) : plan.url;
      }

      const updatedData = {
        name: projectName,
        category: projectCategory,
        price: Number(projectPrice),
        totalMP: Number(totalMP),
        usableMP: Number(usableMP),
        images: uploadedImages,
        floors,
        plans: uploadedPlans,
        updatedAt: new Date().toISOString(),
      };

      const res = await updateProjectInDatabase(id, updatedData);
      if (res.success) {
        toast.success("Proiect actualizat cu succes!");
        router.push(`/project-detail?title=${encodeURIComponent(projectName)}`);
      } else toast.error("Eroare la actualizare!");
    } catch (err) {
      console.error(err);
      toast.error("Eroare la actualizarea proiectului.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Toaster position="top-right" />

      {/* Top Band */}
      <div className="fixed w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md bg-[#3D3B3B]">
        <div className="flex items-center gap-2">
          {loggedUser && <span className="font-semibold text-white">Conectat ca: {loggedUser.email}</span>}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white font-semibold hover:text-gray-300 transition">Home</button>
          <button onClick={handleLogout} className="text-white font-semibold hover:text-gray-300 transition">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-auto px-6 py-8 space-y-10 pt-16">
        {/* Project Info */}
        <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
          <h1 className="text-2xl font-bold mb-4">Editare Proiect</h1>

          <div>
            <label className="block mb-1 font-semibold text-gray-700">Nume Proiect</label>
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-gray-700">Categorie</label>
            <select value={projectCategory} onChange={e => setProjectCategory(e.target.value)} className="w-full border rounded-lg p-2">
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Pret (€)</label>
              <input type="number" value={projectPrice} onChange={e => setProjectPrice(e.target.value)} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Metri pătrați totali</label>
              <input type="number" step="0.1" value={totalMP} onChange={e => setTotalMP(e.target.value)} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Metri pătrați utili</label>
              <input type="number" step="0.1" value={usableMP} onChange={e => setUsableMP(e.target.value)} className="w-full border rounded-lg p-2" />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Imagini</label>
            <input type="file" multiple onChange={handleImageUpload} className="mb-2"/>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-32 h-32">
                  <img src={img.url} alt="preview" className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full text-white"><X size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floors */}
        <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Compartimentare</h2>

          <select
            value=""
            onChange={(e) => {
              const floorType = e.target.value;
              if (floorType) setFloors([...floors, { type: floorType, rooms: [] }]);
            }}
            className={`px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-600 text-white hover:bg-green-700 ${availableFloors.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={availableFloors.length === 0}
          >
            <option value="" disabled>+ Adaugă Etaj</option>
            {availableFloors.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {floors.map((floor, floorIndex) => (
            <div key={floorIndex} className="border p-3 rounded-md space-y-2 relative">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{floor.type}</h3>
                <button onClick={() => removeFloor(floorIndex)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
              </div>

              <table className="w-full text-gray-800">
                <thead>
                  <tr>
                    <th>Camera</th>
                    <th>Suprafață (mp)</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {floor.rooms.map((room, roomIndex) => (
                    <tr key={roomIndex}>
                      <td>
                        <select value={room.roomType} onChange={(e) => updateRoom(floorIndex, roomIndex, "roomType", e.target.value)} className="w-full border rounded-md p-1">
                          {ROOM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" value={room.mp} onChange={(e) => updateRoom(floorIndex, roomIndex, "mp", e.target.value)} className="w-full border rounded-md p-1" />
                      </td>
                      <td className="text-center">
                        <button onClick={() => removeRoom(floorIndex, roomIndex)} className="text-red-600"><X size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => addRoom(floorIndex)} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md mt-2">
                <Plus size={12}/> Adaugă Cameră
              </button>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Planuri</h2>
          {floors.map((floor, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span>{floor.type}</span>
              <input type="file" accept="image/*" onChange={(e) => handlePlanUpload(e, floor.type)} />
              {plans[floor.type] && <img src={plans[floor.type].url} alt="Plan" className="w-24 h-24 object-cover rounded-md" />}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-6 my-6">
          <button onClick={handleUpdateProject} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">{isSaving ? "Se actualizează..." : "Actualizează Proiect"}</button>
          <button onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">Șterge Proiect</button>
        </div>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg" />
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
      
    export default EditProject;
