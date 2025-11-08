import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SpinnerOverlay from "@/components/SpinnerOverlay";
import { Euro, Bed, Bath, Laptop, Car, Home, Phone, Mail } from "lucide-react";
import { Range } from "react-range";
import { CATEGORIES } from "@/lib/constants";

const ProjectDetail = () => {
  const router = useRouter();
  const { title } = router.query;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedFloors, setExpandedFloors] = useState({});
  const [filters, setFilters] = useState({
    bedrooms: "",
    bathrooms: "",
    hasGarage: false,
    maxMP: "",
    priceRange: [250, 10000],
  });
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const storedProject = sessionStorage.getItem("selectedProject");
    if (storedProject) {
      setProject(JSON.parse(storedProject));
      setLoading(false);
    } else {
      router.push("/");
    }

    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) setLoggedUser(JSON.parse(storedUser));
  }, []);

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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Band */}
      <div className="fixed w-full h-12 flex justify-between items-center px-6 text-sm text-white shadow-md bg-[#3D3B3B] z-10">
        <div className="flex items-center gap-4">
          {loggedUser && <span className="font-semibold">Conectat ca: {loggedUser.email}</span>}
          <button onClick={() => router.push("/")} className="hover:text-gray-300 transition">
            Home
          </button>
        </div>
        <div>
          {!loggedUser ? (
            <button onClick={() => router.push("/login")} className="hover:text-gray-300 transition">
              Login
            </button>
          ) : (
            <button onClick={handleLogout} className="hover:text-gray-300 transition">
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Project Title + Price */}
      <div className="flex justify-between items-center mt-16 px-6 max-w-[1200px] mx-auto">
        <div className="bg-gray-100 rounded-lg shadow-lg p-4 flex-1 mr-4">
          <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
        </div>
        <div className="bg-[#3D3B3B] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-1">
          <span>{project.price}</span>
          <Euro size={14} />
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mt-2 px-6 max-w-[1200px] mx-auto text-sm text-gray-500 space-x-2">
        <span className="hover:underline cursor-pointer" onClick={() => router.push("/")}>
          Home
        </span>{" "}
        &gt;
        <span
          className="hover:underline cursor-pointer"
          onClick={() =>
            router.push(`/project-list?category=${encodeURIComponent(project.category)}`)
          }
        >
          {project.category}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row mt-6 px-6 max-w-[1200px] mx-auto gap-6">
        {/* Left content - 2/3 */}
        <div className="lg:w-2/3 w-full space-y-6">
          {/* Image Carousel */}
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={project.images?.[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setPreviewImage(project.images[currentImageIndex])}
            />
            {project.images?.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-2 hover:bg-white"
                  onClick={() =>
                    setCurrentImageIndex(
                      (currentImageIndex - 1 + project.images.length) % project.images.length
                    )
                  }
                >
                  &#8592;
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-2 hover:bg-white"
                  onClick={() =>
                    setCurrentImageIndex((currentImageIndex + 1) % project.images.length)
                  }
                >
                  &#8594;
                </button>
              </>
            )}
          </div>

          {/* General Info */}
          <div className="p-6 bg-gray-100 rounded-lg shadow-md space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Informatii generale</h2>
            <div className="flex flex-wrap gap-6 text-gray-700">
              <div className="flex flex-col items-center">
                <Home size={24} className="text-[#3D3B3B]" />
                <span>{project.usableMP} m<sup>2</sup></span>
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
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Compartimentare</h2>
            {project.floors?.map((floor, idx) => (
              <div key={idx} className="p-4 bg-gray-100 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">{floor.type}</h3>
                <table className="w-full text-gray-800 border-collapse border border-gray-300">
                  <thead className="bg-[#3D3B3B] text-white">
                    <tr>
                      <th className="border px-2 py-1 text-left">Room Type</th>
                      <th className="border px-2 py-1 text-left">mp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floor.rooms?.map((room, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-gray-50" : "bg-gray-100"}>
                        <td className="border px-2 py-1">{room.roomType}</td>
                        <td className="border px-2 py-1">{room.mp} m<sup>2</sup></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Detalii suplimentare */}
          <div className="p-4 bg-gray-100 rounded-lg shadow-md space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Detalii suplimentare</h2>
            <p>Metri pătrați totali: {project.totalMP} m<sup>2</sup></p>
            <p>Metri pătrați utili: {project.usableMP} m<sup>2</sup></p>
          </div>

          {/* Planuri de nivel */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Planuri de nivel</h2>
            {project.floors?.map((floor, idx) => (
              <div key={idx}>
                <button
                  className="px-4 py-2 bg-[#3D3B3B] text-white rounded-lg mb-2"
                  onClick={() =>
                    setExpandedFloors((prev) => ({
                      ...prev,
                      [floor.type]: !prev[floor.type],
                    }))
                  }
                >
                  {floor.type}
                </button>
                {expandedFloors[floor.type] && project.plans?.[floor.type]?.url && (
                  <img
                    src={project.plans[floor.type].url}
                    alt={`Plan ${floor.type}`}
                    className="w-full h-96 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right content - 1/3 */}
        <div className="lg:w-1/3 w-full space-y-6">
          {/* Filters */}
          <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtre</h2>

            <label className="block mb-2 font-medium text-gray-700">Număr dormitoare:</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              className="w-full border rounded-lg p-2 mb-4"
            >
              <option value="">Toate</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <label className="block mb-2 font-medium text-gray-700">Număr băi:</label>
            <select
              value={filters.bathrooms}
              onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
              className="w-full border rounded-lg p-2 mb-4"
            >
              <option value="">Toate</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={filters.hasGarage}
                onChange={(e) => setFilters({ ...filters, hasGarage: e.target.checked })}
              />
              <span>Cu garaj</span>
            </label>

            <label className="block mb-2 font-medium text-gray-700">Metri pătrați maximi:</label>
            <input
              type="number"
              value={filters.maxMP}
              onChange={(e) => setFilters({ ...filters, maxMP: e.target.value })}
              className="w-full border rounded-lg p-2 mb-4"
              placeholder="ex: 150"
            />

            <label className="block mb-2 font-medium text-gray-700">
              Interval preț (€): {filters.priceRange[0]} - {filters.priceRange[1]}
            </label>
            <Range
              step={50}
              min={250}
              max={10000}
              values={filters.priceRange}
              onChange={(values) => setFilters({ ...filters, priceRange: values })}
              renderTrack={({ props, children }) => (
                <div {...props} className="h-2 rounded-full bg-gray-300 mt-3 mb-6 relative">
                  <div
                    style={{
                      position: "absolute",
                      height: "100%",
                      background: "#3D3B3B",
                      left: `${((filters.priceRange[0]-250)/(10000-250))*100}%`,
                      width: `${((filters.priceRange[1]-filters.priceRange[0])/(10000-250))*100}%`,
                    }}
                  />
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div {...props} className="w-5 h-5 bg-[#3D3B3B] rounded-full cursor-pointer" />
              )}
            />

            <button
              onClick={handleFilterDetail}
              className="w-full bg-[#3D3B3B] hover:bg-gray-800 text-white font-semibold py-2 rounded-lg transition"
            >
              Căutați
            </button>
          </div>

          {/* Alte categorii */}
          <div className="bg-gray-100 rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Alte categorii</h2>
            <div className="space-y-3">
              {CATEGORIES.filter(c => c !== project.category).map(c => (
                <button
                  key={c}
                  onClick={() => router.push(`/project-list?category=${encodeURIComponent(c)}`)}
                  className="block w-full text-left bg-[#3D3B3B] hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
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
