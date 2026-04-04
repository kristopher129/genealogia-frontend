// Datos del árbol genealógico
export const familyTreeData = [
  { id: 0, name: "Pharos", parent1Id: null, parent2Id: null, gender: "man", country: "GBR", birthYear: 1920, deathYear: 1937, partners: [1] },
  { id: 1, name: "Nogara", parent1Id: null, parent2Id: null, gender: "woman", country: "ITY", birthYear: 1928, deathYear: 1947, nickname: "Example", partners: [0] },
  { id: 2, name: "Nearco", parent1Id: 0, parent2Id: 1, gender: "man", country: "ITY", birthYear: 1935, deathYear: 1957, partners: [3] },
  { id: 3, name: "Mumtaz Begum", parent1Id: null, parent2Id: null, gender: "woman", country: "FRA", birthYear: 1932, deathYear: 1945, partners: [2] },
  { id: 4, name: "Nasrullah", parent1Id: 2, parent2Id: 3, gender: "man", country: "IRE", birthYear: 1940, deathYear: 1959, partners: [] },
  { id: 5, name: "Jane", parent1Id: 2, parent2Id: 3, gender: "woman", country: "USA", birthYear: 1945, deathYear: null, partners: [] },
  { id: 6, name: "Jasper", parent1Id: 2, parent2Id: 3, gender: "man", country: "USA", birthYear: 1948, deathYear: null, partners: [] },
];

export const targetPersonId = 0;