import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import { Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import ProjectCard from "@/components/ProjectCard";
import { CATEGORIES } from "@/constants";

const ProjectList = () => {
  const router = useRouter();
  const { category } = router.query;

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState(null);

  // Filtre
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

  // Fetch projects + preload images
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
        setFilteredProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [category]);

  const countRooms = (floors, types) => {
    let count = 0;
    floors?.forEach((floor) =>
      floor.rooms?.forEach((r) => {
        if (types.includes(r.roomType)) count++;
      })
    );
    return count;
  };

  const handleFilter = () => {
    const { bedrooms, bathrooms, hasGarage, maxMP, priceRange } = filters;
    let result = [...projects];

    if (bedrooms)
      result = result.filter(
        (p) =>
          countRooms(p.floors, ["Dormitor", "Dormitor matrimonial"]) ===
          Number(bedrooms)
      );

    if (bathrooms)
      result = result.filter(
        (p) =>
          countRooms(p.floors, ["Baie", "Baie matrimoniala", "Grup sanitar"]) ===
          Number(bathrooms)
      );

    if (hasGarage)
      result = result.filter((p) => countRooms(p.floors, ["Garaj"]) > 0);

    if (maxMP)
      result = result.filter((p) => Number(p.usableMP) <= Number(maxMP));

    if (priceRange[0] > 250 || priceRange[1] < 10000)
      result = result.filter(
        (p) =>
          Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]
      );

    setFilteredProjects(result);
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

  // Alte categorii
  const otherCategories = CATEGORIES.filter((c) => c.text !== category);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top band */}
      <div className="w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md bg-[#3D3B3B]">
        <div>
          {loggedUser && <span className="font-semibold">Conectat ca: {loggedUser.email}</span>}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="hover:text-gray-300 transition"
          >
            Home
          </button>
          {!loggedUser ? (
            <button
              onClick={() => router.push("/login")}
              className="hover:text-gray-300 transition"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="hover:text-gray-300 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Titlu */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold text-gray-800">{category}</h1>
      </div>

      {/* Conținut */}
      <div
        className={`flex-grow flex flex-col lg:flex-row justify-center items-start gap-6 mt-8 px-6 pb-10 ${
          singleProject ? "items-center" : ""
        }`}
      >
        {/* Stânga: proiecte */}
        <div
          className={`grid gap-6 ${
            singleProject ? "grid-cols-1 w-full max-w-xl" : "grid-cols-1 sm:grid-cols-2 flex-1"
          }`}
        >
          {filteredProjects.length === 0 ? (
            <p className="text-gray-600 text-center col-span-2">
              Nu există proiecte care să corespundă filtrării.
            </p>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} countRooms={countRooms} />
            ))
          )}
        </div>

        {/* Dreapta: filtre + alte categorii */}
        <div
          className={`${
            singleProject ? "w-full max-w-xl mt-6" : "lg:w-1/3 w-full"
          } space-y-8`}
        >
          {/* 🔹 Filtre */}
          <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtre</h2>

            {/* Numar dormitoare */}
            <label className="block mb-2 font-medium text-gray-700">Număr dormitoare:</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              className="w-full border rounded-lg p-2 mb-4"
            >
              <option value="">Toate</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* Numar bai */}
            <label className="block mb-2 font-medium text-gray-700">Număr băi:</label>
            <select
              value={filters.bathrooms}
              onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
              className="w-full border rounded-lg p-2 mb-4"
            >
              <option value="">Toate</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* Garaj */}
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={filters.hasGarage}
                onChange={(e) => setFilters({ ...filters, hasGarage: e.target.checked })}
              />
              <span>Cu garaj</span>
            </label>

            {/* Max MP */}
            <label className="block mb-2 font-medium text-gray-700">Metri pătrați maximi:</label>
            <input
              type="number"
              value={filters.maxMP}
              onChange={(e) => setFilters({ ...filters, maxMP: e.target.value })}
              className="w-full border rounded-lg p-2 mb-4"
              placeholder="ex: 150"
            />

            {/* Slider pret */}
            <label className="block mb-2 font-medium text-gray-700">
              Interval preț (€): {filters.priceRange[0]} - {filters.priceRange[1]}
            </label>
            <div className="flex items-center gap-2 mb-6">
              <input
                type="range"
                min="250"
                max="10000"
                value={filters.priceRange[0]}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priceRange: [Number(e.target.value), filters.priceRange[1]],
                  })
                }
                className="w-full accent-gray-700"
              />
              <input
                type="range"
                min="250"
                max="10000"
                value={filters.priceRange[1]}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priceRange: [filters.priceRange[0], Number(e.target.value)],
                  })
                }
                className="w-full accent-gray-700"
              />
            </div>

            <button
              onClick={handleFilter}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition"
            >
              Căutați
            </button>
          </div>

          {/* Alte categorii */}
          <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Alte categorii</h2>
            <div className="space-y-3">
              {otherCategories.map((c) => (
                <button
                  key={c.text}
                  onClick={() => router.push(`/project-list?category=${encodeURIComponent(c.text)}`)}
                  className="block w-full text-left bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
                >
                  {c.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full h-10 flex justify-end items-center px-6 text-sm text-white shadow-md mt-auto bg-[#3D3B3B]">
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
