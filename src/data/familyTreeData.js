// Datos del árbol genealógico
export const familyTreeData = [
  { id: 0, name: "Niclas Superlongsurname", parent1Id: null, parent2Id: null, gender: "man", partners: [1] },
  { id: 1, name: "Iliana", parent1Id: null, parent2Id: null, gender: "woman", nickname: "Illi", partners: [0] },
  { id: 2, name: "James", parent1Id: 0, parent2Id: 1, gender: "man", partners: [3] },
  { id: 3, name: "Alexandra", parent1Id: null, parent2Id: null, gender: "woman", partners: [2] },
  { id: 4, name: "Eric", parent1Id: 3, parent2Id: 2, gender: "man", partners: [] },
  { id: 5, name: "Jane", parent1Id: 2, parent2Id: 3, gender: "woman", partners: [] },
  { id: 6, name: "Jasper", parent1Id: 2, parent2Id: 3, gender: "man", partners: [] },
];

export const targetPersonId = 0;