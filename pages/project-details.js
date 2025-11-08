import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import ProjectCard from "@/components/ProjectCard";
import { Euro, Bed, Bath, Laptop, Car, Home, Phone, Mail } from "lucide-react";
import { Range } from "react-range";
import { CATEGORIES } from "@/lib/constants";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ProjectDetail = () => {
  const router = useRouter();
  const { title } = router.query;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedFloor, setExpandedFloor] = useState("");
  const [filters, setFilters] = useState({
    bedrooms: "",
    bathrooms: "",
    hasGarage: false,
    maxMP: "",
    priceRange: [250, 10000],
  });
  const [loggedUser, setLoggedUser] = useState(null);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  useEffect(() => {
    const storedProject = sessionStorage.getItem("selectedProject");
    if (storedProject) {
      const parsed = JSON.parse(storedProject);
      setProject(parsed);
      setLoading(false);
      fetchSimilarProjects(parsed.category, parsed.name);
    } else {
      router.push("/");
    }

    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

  const fetchSimilarProjects = async (category, currentName) => {
    try {
      setLoadingSimilar(true);
      const querySnapshot = await getDocs(collection(db, "projects"));
      const allProjects = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filtered = allProjects
        .filter(
          (p) =>
            p.category === category &&
            p.name !== currentName &&
            p.images?.length > 0
        )
        .slice(0, 6);

      setSimilarProjects(filtered);
    } catch (error) {
      console.error("Error fetching similar projects:", error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  if (loading || !project) return <SpinnerOverlay />;

  const countRooms = (types) =>
    project.floors?.reduce((acc, floor) => {
      floor.rooms?.forEach((r) => {
        if (types.includes(r.roomType)) acc++;
      });
      return acc;
    }, 0);

  const bedrooms = countRooms(["Dormitor", "Dormitor matrimonial"]);
  const bathrooms = countRooms(["Baie", "Baie matrimoniala", "Grup sanitar"]);
  const offices = countRooms(["Birou"]);
  const garages = countRooms(["Garaj"]);

  const handleFilterDetail = () => {
    const query = { category: project.category };
    if (filters.bedrooms) query.bedrooms = filters.bedrooms;
    if (filters.bathrooms) query.bathrooms = filters.bathrooms;
    if (filters.hasGarage) query.hasGarage = filters.hasGarage;
    if (filters.maxMP) query.maxMP = filters.maxMP;
    if (filters.priceRange) {
      query.priceMin = filters.priceRange[0];
      query.priceMax = filters.priceRange[1];
    }
    router.push({ pathname: "/project-list", query });
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setLoggedUser(null);
    router.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Band */}
      <div className="fixed w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md bg-[#3D3B3B] z-10">
        <div>
          {loggedUser && (
            <span className="font-semibold">
              Conectat ca: {loggedUser.email}
            </span>
          )}
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

      {/* Title + Breadcrumb */}
      <div className="mt-16 px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-[1200px] bg-gray-100 rounded-lg shadow-md p-6 flex flex-col lg:flex-row justify-between items-start gap-4 border border-gray-300">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
              <div className="text-sm text-gray-600 mt-2 underline">
                <span
                  className="cursor-pointer hover:text-gray-800"
                  onClick={() => router.push("/")}
                >
                  Home
                </span>{" "}
                &gt;{" "}
                <span
                  className="cursor-pointer hover:text-gray-800"
                  onClick={() =>
                    router.push(
                      `/project-list?category=${encodeURIComponent(
                        project.category
                      )}`
                    )
                  }
                >
                  {project.category}
                </span>{" "}
                &gt; <span className="text-gray-800">{project.name}</span>
              </div>
            </div>
            <div className="bg-[#3D3B3B] text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-center text-3xl font-bold">
              <span>{project.price}</span>
              <Euro size={24} className="ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-auto px-6 pb-32 mt-6">
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1200px] mx-auto">
          {/* Left 2/3 */}
          <div className="lg:w-2/3 w-full flex flex-col gap-6">
            {/* Carousel */}
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={project.images?.[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() =>
                  setPreviewImage(project.images[currentImageIndex])
                }
              />
              {project.images?.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-2 hover:bg-white"
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex - 1 + project.images.length) %
                          project.images.length
                      )
                    }
                  >
                    &#8592;
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-2 hover:bg-white"
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex + 1) % project.images.length
                      )
                    }
                  >
                    &#8594;
                  </button>
                </>
              )}
            </div>

            {/* Informatii generale */}
            <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Informatii generale
              </h2>
              <div className="flex flex-wrap gap-6 text-gray-700">
                <div className="flex flex-col items-center">
                  <Home size={24} className="text-[#3D3B3B]" />
                  <span>
                    {project.usableMP} m<sup>2</sup>
                  </span>
                </div>
                {bedrooms > 0 && (
                  <div className="flex flex-col items-center">
                    <Bed size={24} className="text-[#3D3B3B]" />
                    <span>{bedrooms} dormitoare</span>
                  </div>
                )}
                {bathrooms > 0 && (
                  <div className="flex flex-col items-center">
                    <Bath size={24} className="text-[#3D3B3B]" />
                    <span>{bathrooms} băi</span>
                  </div>
                )}
                {offices > 0 && (
                  <div className="flex flex-col items-center">
                    <Laptop size={24} className="text-[#3D3B3B]" />
                    <span>{offices} birou</span>
                  </div>
                )}
                {garages > 0 && (
                  <div className="flex flex-col items-center">
                    <Car size={24} className="text-[#3D3B3B]" />
                    <span>{garages} garaj</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compartimentare */}
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Compartimentare
              </h2>
              {project.floors?.map((floor, idx) => (
                <div key={idx} className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Etaj: {floor.type}
                  </h3>
                  <table className="w-full text-gray-800 border-collapse border border-gray-300">
                    <thead className="bg-[#3D3B3B] text-white">
                      <tr>
                        <th className="border px-2 py-1 text-left">
                          Tip cameră
                        </th>
                        <th className="border px-2 py-1 text-left">mp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floor.rooms?.map((room, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            rIdx % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                          }
                        >
                          <td className="border px-2 py-1">{room.roomType}</td>
                          <td className="border px-2 py-1">
                            {room.mp} m<sup>2</sup>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Detalii suplimentare */}
            <div className="p-4 bg-gray-100 rounded-lg shadow-md space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Detalii suplimentare
              </h2>
              <p>
                Metri pătrați totali: {project.totalMP} m<sup>2</sup>
              </p>
              <p>
                Metri pătrați utili: {project.usableMP} m<sup>2</sup>
              </p>
            </div>

            {/* Planuri de nivel */}
            <div className="p-6 bg-gray-100 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Planuri de nivel
              </h2>
              <select
                className="w-full border rounded-lg p-2 mb-4"
                value={expandedFloor}
                onChange={(e) => setExpandedFloor(e.target.value)}
              >
                <option value="">Selectați etajul</option>
                {project.floors?.map((floor) => (
                  <option key={floor.type} value={floor.type}>
                    {floor.type}
                  </option>
                ))}
              </select>
              {expandedFloor && project.plans?.[expandedFloor] && (
                <img
                  src={project.plans[expandedFloor]}
                  alt={`Plan ${expandedFloor}`}
                  className="w-full h-auto object-cover rounded-lg cursor-pointer"
                  onClick={() =>
                    setPreviewImage(project.plans[expandedFloor])
                  }
                />
              )}
            </div>

            {/* Proiecte similare */}
            <div className="mt-10">
              <div className="bg-[#3D3B3B] text-white px-6 py-3 rounded-t-lg text-2xl font-semibold shadow-lg">
                Proiecte similare
              </div>
              <div className="bg-gray-100 rounded-b-lg shadow-lg p-6">
                {loadingSimilar ? (
                  <SpinnerOverlay />
                ) : similarProjects.length === 0 ? (
                  <p className="text-gray-700 text-center py-10">
                    Nu există alte proiecte similare în această categorie.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {similarProjects.map((p) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 w-full flex flex-col gap-6">
            <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Filtre
              </h2>
              <label className="block mb-2 font-medium text-gray-700">
                Număr dormitoare:
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) =>
                  setFilters({ ...filters, bedrooms: e.target.value })
                }
                className="w-full border rounded-lg p-2 mb-4"
              >
                <option value="">Toate</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <label className="block mb-2 font-medium text-gray-700">
                Număr băi:
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) =>
                  setFilters({ ...filters, bathrooms: e.target.value })
                }
                className="w-full border rounded-lg p-2 mb-4"
              >
                <option value="">Toate</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={filters.hasGarage}
                  onChange={(e) =>
                    setFilters({ ...filters, hasGarage: e.target.checked })
                  }
                />
                <span>Cu garaj</span>
              </label>

              <label className="block mb-2 font-medium text-gray-700">
                Metri pătrați maximi:
              </label>
              <input
                type="number"
                value={filters.maxMP}
                onChange={(e) =>
                  setFilters({ ...filters, maxMP: e.target.value })
                }
                className="w-full border rounded-lg p-2 mb-4"
                placeholder="ex: 150"
              />

              <label className="block mb-2 font-medium text-gray-700">
                Interval preț (€): {filters.priceRange[0]} -{" "}
                {filters.priceRange[1]}
              </label>
              <Range
                step={50}
                min={250}
                max={10000}
                values={filters.priceRange}
                onChange={(values) =>
                  setFilters({ ...filters, priceRange: values })
                }
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="h-2 rounded-full bg-gray-300 mt-3 mb-6 relative"
                  >
                    <div
                      style={{
                        position: "absolute",
                        height: "100%",
                        background: "#3D3B3B",
                        left: `${((filters.priceRange[0] - 250) /
                          (10000 - 250)) *
                          100}%`,
                        width: `${((filters.priceRange[1] -
                          filters.priceRange[0]) /
                          (10000 - 250)) *
                          100}%`,
                      }}
                    />
                    {children}
                  </div>
                )}
                renderThumb={({ props }) => (
                  <div
                    {...props}
                    className="w-5 h-5 bg-[#3D3B3B] rounded-full cursor-pointer"
                  />
                )}
              />

              <button
                onClick={handleFilterDetail}
                className="w-full bg-[#3D3B3B] hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition"
              >
                Căutați
              </button>
            </div>

            <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Alte categorii
              </h2>
              <div className="space-y-3">
                {CATEGORIES.filter((c) => c !== project.category).map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      router.push(
                        `/project-list?category=${encodeURIComponent(c)}`
                      )
                    }
                    className="block w-full text-left bg-[#3D3B3B] hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
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

export default ProjectDetail;
