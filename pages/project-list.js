import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import { Bed, Bath, Home, Car, Laptop, Phone, Mail, Euro,} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

const ProjectList = () => {
  const router = useRouter();
  const { category } = router.query;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

  // Fetch projects
  useEffect(() => {
    if (!category) return;

    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "projects"), where("category", "==", category));
        const snapshot = await getDocs(q);
        const projectList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [category]);

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

  // Room Count
  const countRooms = (floors, types) => {
    let count = 0;
    floors?.forEach((floor) => {
      floor.rooms?.forEach((r) => {
        if (types.includes(r.roomType)) count++;
      });
    });
    return count;
  };

  if (loading) return <SpinnerOverlay />;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Band */}
      <div
        className="w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md"
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

      {/* Title */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold text-gray-800">{category}</h1>
      </div>

      {/* Content layout */}
      <div className="flex flex-col lg:flex-row justify-center gap-6 mt-8 px-6 pb-10">
        {/* Left: Project Cards */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <p className="text-gray-600 text-center col-span-2">
              Nu există proiecte în această categorie.
            </p>
          ) : (
            projects.map((project) => {
              const bedrooms = countRooms(project.floors, ["Dormitor", "Dormitor matrimonial"]);
              const bathrooms = countRooms(project.floors, ["Baie", "Baie matrimoniala", "Grup sanitar"]);
              const offices = countRooms(project.floors, ["Birou"]);
              const garages = countRooms(project.floors, ["Garaj"]);

              return (
                <div
                  key={project.id}
                  className="bg-gray-100 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col sm:flex-row transform hover:scale-[1.01]"
                >
                  {/* Image slideshow */}
                  <div className="relative sm:w-1/2 w-full">
                    <img
                      src={project.images?.[0]}
                      alt={project.name}
                      className="w-full h-56 object-cover rounded-l-lg"
                    />
                  </div>

                  {/* Project info */}
                  <div className="flex flex-col justify-between p-4 sm:w-1/2 w-full">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
                        <div className="bg-gray-700 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                          <span>{project.price}</span>
                          <Euro size={14} />
                        </div>
                      </div>

                      <div className="space-y-2 text-gray-700">
                        {bedrooms > 0 && (
                          <div className="flex items-center gap-2">
                            <Bed className="text-gray-700" size={18} />
                            <span>{bedrooms} dormitoare</span>
                          </div>
                        )}

                        {offices > 0 && (
                          <div className="flex items-center gap-2">
                            <Laptop className="text-gray-700" size={18} />
                            <span>{offices} birouri</span>
                          </div>
                        )}

                        {bathrooms > 0 && (
                          <div className="flex items-center gap-2">
                            <Bath className="text-gray-700" size={18} />
                            <span>{bathrooms} băi</span>
                          </div>
                        )}

                        {garages > 0 && (
                          <div className="flex items-center gap-2">
                            <Car className="text-gray-700" size={18} />
                            <span>{garages} garaje</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Home className="text-gray-700" size={18} />
                          <span>{project.usableMP} mp utili</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Filters */}
        <div className="lg:w-1/3 w-full bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtre</h2>
          <p className="text-gray-500 italic">Filtrele vor fi adăugate în curând...</p>
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
            <span>{process.env.NEXT_PUBLIC_CONTACT_PHONE}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>{process.env.NEXT_PUBLIC_CONTACT_EMAIL}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectList;
