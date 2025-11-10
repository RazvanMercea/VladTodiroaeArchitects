import { db } from "./firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const storage = getStorage();

export const addProjectToDatabase = async (projectData) => {
  try {
    const imageUrls = await Promise.all(
      projectData.images.map(async (img) => {
        const storageRef = ref(storage, `projects/${projectData.id}/images/${img.file.name}`);
        await uploadBytes(storageRef, img.file);
        return await getDownloadURL(storageRef);
      })
    );

    const planUrls = await Promise.all(
      Object.keys(projectData.plans).map(async (floorType) => {
        const file = projectData.plans[floorType].file;
        const storageRef = ref(storage, `projects/${projectData.id}/plans/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return { floorType, url };
      })
    );

    const docData = {
      ...projectData,
      images: imageUrls,
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

export const updateProjectInDatabase = async (projectId, updatedData) => {
  try {
    const projectRef = doc(db, "projects", projectId);

    const imageUrls = await Promise.all(
      updatedData.images.map(async (img) => {
        if (img.url) return img.url; // existing image
        const storageRef = ref(storage, `projects/${projectId}/images/${img.file.name}`);
        await uploadBytes(storageRef, img.file);
        return await getDownloadURL(storageRef);
      })
    );

    const planUrls = await Promise.all(
      Object.keys(updatedData.plans).map(async (floorType) => {
        const plan = updatedData.plans[floorType];
        if (plan.url) return { floorType, url: plan.url };
        const storageRef = ref(storage, `projects/${projectId}/plans/${plan.file.name}`);
        await uploadBytes(storageRef, plan.file);
        const url = await getDownloadURL(storageRef);
        return { floorType, url };
      })
    );

    const docData = {
      ...updatedData,
      images: imageUrls,
      plans: planUrls.reduce((acc, p) => ({ ...acc, [p.floorType]: p.url }), {}),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(projectRef, docData);

    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error };
  }
};

export const deleteProjectFromDatabase = async (projectId) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const storageRef = ref(storage, `projects/${projectId}`);

    try {
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Some files may not exist in storage:", err.message);
    }

    await deleteDoc(projectRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error };
  }
};
