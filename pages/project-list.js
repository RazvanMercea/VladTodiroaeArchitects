import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import { Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import ProjectCard from "@/components/ProjectCard";
import { CATEGORIES } from "@/lib/constants";
import { Range } from "react-range";

const ProjectList = () => {
  const router = useRouter();
  const { category, bedrooms: qBedrooms, bathrooms: qBathrooms, hasGarage: qHasGarage, maxMP: qMaxMP, priceMin, priceMax } = router.query;

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState(null);
  const [filters, setFilters] = useState({
    bedrooms: "",
    bathrooms: "",
    hasGarage: false,
    maxMP: "",
    priceRange: [250, 10000],
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!category) return;
    const initialFilters = { ...filters };

    if (qBedrooms) initialFilters.bedrooms = qBedrooms;
    if (qBathrooms) initialFilters.bathrooms = qBathrooms;
    if (qHasGarage) initialFilters.hasGarage = qHasGarage === "true";
    if (qMaxMP) initialFilters.maxMP = qMaxMP;
    if (priceMin && priceMax) initialFilters.priceRange = [Number(priceMin), Number(priceMax)];

    setFilters(initialFilters);
  }, [category, qBedrooms, qBathrooms, qHasGarage, qMaxMP, priceMin, priceMax]);

  // Fetch projects by category
  useEffect(() => {
    if (!category) return;
    setLoading(true);

    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "projects"), where("category", "==", category));
        const snapshot = await getDocs(q);
        const projectList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const allImages = projectList.flatMap((p) => p.images || []);
        await Promise.all(
          allImages.map(
            (src) =>
              new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
              })
          )
        );

        setProjects(projectList);
        setFilteredProjects(projectList); // Initially show all
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [category]);

  // Apply filters manually only
  const applyFilters = () => {
    let result = [...projects];
    const { bedrooms, bathrooms, hasGarage, maxMP, priceRange } = filters;

    if (bedrooms) result = result.filter(p => countRooms(p.floors, ["Dormitor", "Dormitor matrimonial"]) === Number(bedrooms));
    if (bathrooms) result = result.filter(p => countRooms(p.floors, ["Baie", "Baie matrimoniala", "Grup sanitar"]) === Number(bathrooms));
    if (hasGarage) result = result.filter(p => countRooms(p.floors, ["Garaj"]) > 0);
    if (maxMP) result = result.filter(p => Number(p.usableMP) <= Number(maxMP));
    if (priceRange[0] > 250 || priceRange[1] < 10000) {
      result = result.filter(p => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);
    }

    setFilteredProjects(result);
  };

  // Trigger filter button
  const handleFilterButton = () => {
    applyFilters();
    router.push({
      pathname: "/project-list",
      query: {
        category,
        bedrooms: filters.bedrooms || undefined,
        bathrooms: filters.bathrooms || undefined,
        hasGarage: filters.hasGarage || undefined,
        maxMP: filters.maxMP || undefined,
        priceMin: filters.priceRange[0],
        priceMax: filters.priceRange[1],
      },
    }, undefined, { shallow: true });
  };

  const handleLogout = () => {
    toast((t) => (
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
    ));
  };

  if (loading) return <SpinnerOverlay />;

  const singleProject = filteredProjects.length === 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top band */}
      <div className="fixed w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md bg-[#3D3B3B] z-10">
        <div>
          {loggedUser && <span className="font-semibold">Conectat ca: {loggedUser.email}</span>}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="hover:text-gray-300 transition">Home</button>
          {!loggedUser ? (
            <button onClick={() => router.push("/login")} className="hover:text-gray-300 transition">Login</button>
          ) : (
            <button onClick={handleLogout} className="hover:text-gray-300 transition">Logout</button>
          )}
        </div>
      </div>

      {/* Title card */}
      <div className="flex justify-center mt-16 px-6">
        <div className="bg-gray-100 rounded-lg shadow-lg p-4 w-full flex justify-center max-w-[1200px]">
          <h1 className="text-3xl font-bold text-gray-800 text-center">{category}</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-auto px-6 pb-28 mt-6 mb-10 relative z-0">
        <div className="flex flex-col lg:flex-row justify-center items-start gap-6">
          {/* Projects */}
          <div className={`grid gap-6 ${singleProject || filteredProjects.length === 0 ? "grid-cols-1 w-full max-w-xl" : "grid-cols-1 sm:grid-cols-2 flex-1"}`}>
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full py-20 px-4">
                <p className="text-gray-700 text-center text-lg mb-4">
                  Din păcate nu există proiecte care să corespundă căutării dumneavoastră.
                </p>
                <p className="text-gray-700 text-center text-lg">
                  Contactați-ne pentru un proiect personalizat!
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    countRooms={(types) => {
                        let total = 0;
                        project.floors?.forEach(floor =>
                        floor.rooms?.forEach(r => {
                            if (types.includes(r.roomType)) total++;
                        })
                        );
                        return total;
                    }}
                    />
              ))
            )}
          </div>

          {/* Filters */}
          <div className={`${singleProject ? "w-full max-w-xl" : "lg:w-1/3 w-full"} space-y-8`}>
            <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtre</h2>

              <label className="block mb-2 font-medium text-gray-700">Număr dormitoare:</label>
              <select value={filters.bedrooms} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })} className="w-full border rounded-lg p-2 mb-4">
                <option value="">Toate</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <label className="block mb-2 font-medium text-gray-700">Număr băi:</label>
              <select value={filters.bathrooms} onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })} className="w-full border rounded-lg p-2 mb-4">
                <option value="">Toate</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={filters.hasGarage} onChange={(e) => setFilters({ ...filters, hasGarage: e.target.checked })} />
                <span>Cu garaj</span>
              </label>

              <label className="block mb-2 font-medium text-gray-700">Metri pătrați maximi:</label>
              <input type="number" value={filters.maxMP} onChange={(e) => setFilters({ ...filters, maxMP: e.target.value })} className="w-full border rounded-lg p-2 mb-4" placeholder="ex: 150" />

              <label className="block mb-2 font-medium text-gray-700">Interval preț (€): {filters.priceRange[0]} - {filters.priceRange[1]}</label>
              <Range
                step={50}
                min={250}
                max={10000}
                values={filters.priceRange}
                onChange={(values) => setFilters({ ...filters, priceRange: values })}
                renderTrack={({ props, children }) => (
                  <div {...props} className="h-2 rounded-full bg-gray-300 mt-3 mb-6 relative">
                    <div style={{ position: "absolute", height: "100%", background: "#3D3B3B", left: `${((filters.priceRange[0]-250)/(10000-250))*100}%`, width: `${((filters.priceRange[1]-filters.priceRange[0])/(10000-250))*100}%` }} />
                    {children}
                  </div>
                )}
                renderThumb={({ props }) => <div {...props} className="w-5 h-5 bg-[#3D3B3B] rounded-full cursor-pointer" />}
              />

              <button onClick={handleFilterButton} className="w-full bg-[#3D3B3B] hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition">Căutați</button>
            </div>

            {/* Alte categorii */}
            <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Alte categorii</h2>
              <div className="space-y-3">
                {CATEGORIES.filter((c) => c !== category).map(c => (
                  <button key={c} onClick={() => router.push(`/project-list?category=${encodeURIComponent(c)}`)} className="block w-full text-left bg-[#3D3B3B] hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition">{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed w-full h-10 flex justify-end items-center px-6 text-sm text-white shadow-md bg-[#3D3B3B] bottom-0 z-10">
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
