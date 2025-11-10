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

const deleteAllFilesInFolder = async (folderPath) => {
  try {
    const folderRef = ref(storage, folderPath);
    const list = await listAll(folderRef);

    await Promise.all([
      ...list.items.map((item) => deleteObject(item)),
      ...list.prefixes.map((subfolder) =>
        deleteAllFilesInFolder(subfolder.fullPath)
      ),
    ]);
  } catch (err) {
    console.warn(`Could not delete folder ${folderPath}:`, err.message);
  }
};

export const updateProjectInDatabase = async (docId, updatedData) => {
  try {
    const projectRef = doc(db, "projects", docId);
    const existingSnap = await getDoc(projectRef);

    if (!existingSnap.exists()) {
      throw new Error("Project document does not exist in Firestore.");
    }

    const existingProject = existingSnap.data();

    const imageUrls = await Promise.all(
      updatedData.images.map(async (img) => {
        if (img.url) return img.url;
        return await uploadFileAndGetUrl(
          `projects/${existingProject.id}/images/${img.file.name}`,
          img.file
        );
      })
    );

    const planUrls = await Promise.all(
      Object.keys(updatedData.plans).map(async (floorType) => {
        const plan = updatedData.plans[floorType];
        if (plan.url) return { floorType, url: plan.url };
        const url = await uploadFileAndGetUrl(
          `projects/${existingProject.id}/plans/${plan.file.name}`,
          plan.file
        );
        return { floorType, url };
      })
    );

    const docData = {
      ...existingProject,
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

export const deleteProjectFromDatabase = async (docId) => {
  try {
    const projectRef = doc(db, "projects", docId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error("Project document does not exist in Firestore.");
    }

    const project = projectSnap.data();

    await deleteAllFilesInFolder(`projects/${project.id}`);

    await deleteDoc(projectRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error };
  }
};


