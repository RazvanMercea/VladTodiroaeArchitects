import { db } from "./firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";

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

const uploadFileAndGetUrl = async (path, file) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

const extractPathFromUrl = (url) => {
  const match = url.match(/\/o\/(.+)\?alt=media/);
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteAllFilesInFolder = async (folderPath) => {
  try {
    const folderRef = ref(storage, folderPath);
    const list = await listAll(folderRef);

    await Promise.all([
      ...list.items.map((item) => deleteObject(item)),
      ...list.prefixes.map((subfolder) => deleteAllFilesInFolder(subfolder.fullPath)),
    ]);
  } catch (err) {
    console.warn(`Could not delete folder ${folderPath}:`, err.message);
  }
};

export const updateProjectInDatabase = async (docId, updatedData) => {
  try {
    const projectRef = doc(db, "projects", docId);
    const existingSnap = await getDoc(projectRef);

    if (!existingSnap.exists()) throw new Error("Project document does not exist");

    const existingProject = existingSnap.data();
    const internalId = existingProject.id;

    const imageUrls = await Promise.all(
      updatedData.images.map(async (img) => {
        if (img.url) return img.url;
        if (!img.file) return null;
        return await uploadFileAndGetUrl(
          `projects/${internalId}/images/${img.file.name}`,
          img.file
        );
      })
    );
    const filteredImageUrls = imageUrls.filter(Boolean);

    const removedImages = (existingProject.images || []).filter(
      (url) => !filteredImageUrls.includes(url)
    );
    await Promise.all(
      removedImages.map(async (url) => {
        const path = extractPathFromUrl(url);
        if (path) await deleteObject(ref(storage, path));
      })
    );

    const planUrls = await Promise.all(
      Object.keys(updatedData.plans || {}).map(async (floorType) => {
        const plan = updatedData.plans[floorType];
        if (plan.url) return { floorType, url: plan.url };
        if (!plan.file) return null;
        const url = await uploadFileAndGetUrl(
          `projects/${internalId}/plans/${plan.file.name}`,
          plan.file
        );
        return { floorType, url };
      })
    );

    const filteredPlanUrls = planUrls.filter(Boolean);

    const removedPlans = Object.keys(existingProject.plans || {}).filter(
      (floorType) => !filteredPlanUrls.some((p) => p.floorType === floorType)
    );
    await Promise.all(
      removedPlans.map(async (floorType) => {
        const url = existingProject.plans[floorType];
        const path = extractPathFromUrl(url);
        if (path) await deleteObject(ref(storage, path));
      })
    );

    const docData = {
      ...existingProject,
      ...updatedData,
      images: filteredImageUrls,
      plans: filteredPlanUrls.reduce((acc, p) => ({ ...acc, [p.floorType]: p.url }), {}),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(projectRef, docData);

    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error };
  }
};

export const deleteProjectFromDatabase = async (docId) => {
  try {
    const projectRef = doc(db, "projects", docId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error("Project document does not exist in Firestore.");
    }

    const project = projectSnap.data();
    const internalId = project.id;

    await deleteAllFilesInFolder(`projects/${internalId}`);

    await deleteDoc(projectRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error };
  }
};

