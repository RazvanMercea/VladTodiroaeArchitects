import React, { useEffect, useState } from "react";
import { Bed, Bath, Home, Car, Laptop, Euro } from "lucide-react";
import Lottie from "lottie-react";
import imageLoaderAnimation from "../public/animations/loader.json";

const ProjectCard = ({ project, countRooms }) => {
  const bedrooms = countRooms(project.floors, [
    "Dormitor",
    "Dormitor matrimonial",
  ]);
  const bathrooms = countRooms(project.floors, [
    "Baie",
    "Baie matrimoniala",
    "Grup sanitar",
  ]);
  const offices = countRooms(project.floors, ["Birou"]);
  const garages = countRooms(project.floors, ["Garaj"]);

  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isHovered && project.images?.length > 1) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % project.images.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isHovered, project.images]);

  return (
    <div
      key={project.id}
      className="bg-gray-100 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col sm:flex-row transform hover:scale-[1.01]"
    >
      {/* Image slideshow */}
      <div
        className="relative sm:w-1/2 w-full h-56"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <Lottie animationData={imageLoaderAnimation} loop={true} className="w-16 h-16" />
          </div>
        )}
        <img
          src={project.images?.[currentImage]}
          alt={project.name}
          className="w-full h-full object-cover rounded-l-lg transition-opacity duration-500"
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      </div>

      {/* Project info */}
      <div className="flex flex-col justify-between p-4 sm:w-1/2 w-full">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800">
              {project.name}
            </h2>
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
};

export default ProjectCard;
