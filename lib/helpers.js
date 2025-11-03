export const CATEGORY_FLOOR_RULES = {
  "Proiecte Case Parter": {
    defaultFloors: ["Parter"],
    disabledOptions: ["Etaj 1", "Etaj 2", "Etaj 3"],
    undeletableFloors: ["Parter"]
  },
  "Proiecte Case Etaj": {
    defaultFloors: ["Parter", "Etaj 1"],
    disabledOptions: [],
    undeletableFloors: ["Parter", "Etaj 1"]
  },
  "Proiecte Case Mansarda": {
    defaultFloors: ["Parter", "Mansarda"],
    disabledOptions: [],
    undeletableFloors: ["Parter", "Mansarda"]
  },
};

export const ALL_FLOORS = ["Parter", "Etaj 1", "Etaj 2", "Etaj 3", "Mansarda", "Subsol"];
