export const validateProject = (projectName, images, projectPrice, totalMP, usableMP, floors, plans) => {
  if (!projectName.trim()) return false;
  if (images.length === 0) return false;
  if (!projectPrice || projectPrice <= 0) return false;
  if (!totalMP || totalMP <= 0) return false;
  if (!usableMP || usableMP <= 0) return false;

  // every floor must have at least one room
  for (const floor of floors) {
    if (!floor.rooms || floor.rooms.length === 0) return false;
  }

  // every floor must have one plan
  for (const floor of floors) {
    if (!plans[floor.type]) return false;
  }

  return true;
};