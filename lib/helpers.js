export const getDefaultFloorsForCategory = (category) => {
  switch (category) {
    case "Proiecte Case Parter":
      return ["Parter"];
    case "Proiecte Case Etaj":
      return ["Parter", "Etaj 1"];
    case "Proiecte Case Mansarda":
      return ["Parter", "Mansarda"];
    default:
      return [];
  }
};

export const filterAvailableFloors = (allFloors, selectedFloors) =>
  allFloors.filter((f) => !selectedFloors.includes(f));
