// /lib/projectService.js
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

export const addProjectToDatabase = async (projectData) => {
  try {
    // Upload project images
    const imageUrls = await Promise.all(
      projectData.imageNames.map(async (file) => {
        const storageRef = ref(storage, `projects/${projectData.id}/images/${file}`);
        await uploadBytes(storageRef, projectData.images.find(img => img.file.name === file).file);
        return getDownloadURL(storageRef);
      })
    );

    // Upload plans
    const planUrls = await Promise.all(
      Object.keys(projectData.planNames).map(async (floorType) => {
        const file = projectData.plans[floorType].file;
        const storageRef = ref(storage, `projects/${projectData.id}/plans/${file.name}`);
        await uploadBytes(storageRef, file);
        return { floorType, url: await getDownloadURL(storageRef) };
      })
    );

    // Prepare Firestore document
    const docData = {
      ...projectData,
      images: imageUrls,
      plans: planUrls.reduce((acc, p) => ({ ...acc, [p.floorType]: p.url }), {}),
      createdAt: new Date().toISOString(),
    };

    delete docData.imageNames;
    delete docData.planNames;
    delete docData.images;
    delete docData.plans;

    await addDoc(collection(db, "projects"), docData);

    return { success: true };
  } catch (error) {
    console.error("Error adding project:", error);
    return { success: false, error };
  }
};
