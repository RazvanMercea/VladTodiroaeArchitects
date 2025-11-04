// /lib/projectService.js
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

export const addProjectToDatabase = async (projectData) => {
  try {
    // Upload project images
    const imageUrls = await Promise.all(
      projectData.images.map(async (img) => {
        const storageRef = ref(storage, `projects/${projectData.id}/images/${img.file.name}`);
        await uploadBytes(storageRef, img.file);
        return await getDownloadURL(storageRef);
      })
    );

    // Upload plans
    const planUrls = await Promise.all(
      Object.keys(projectData.plans).map(async (floorType) => {
        const file = projectData.plans[floorType].file;
        const storageRef = ref(storage, `projects/${projectData.id}/plans/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return { floorType, url };
      })
    );

    // Prepare Firestore document
    const docData = {
      ...projectData,
      images: imageUrls, // store URLs
      plans: planUrls.reduce((acc, p) => ({ ...acc, [p.floorType]: p.url }), {}),
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "projects"), docData);

    return { success: true };
  } catch (error) {
    console.error("Error adding project:", error);
    return { success: false, error };
  }
};
