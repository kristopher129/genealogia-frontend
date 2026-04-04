// Datos del árbol genealógico
export const familyTreeData = 
[
  { id: 0, name: "Pharos", parent1Id: null, parent2Id: null, gender: "man", country: "GB", birthYear: 1920, deathYear: 1937, partners: [1] },
  { id: 1, name: "Nogara", parent1Id: null, parent2Id: null, gender: "woman", country: "ITY", birthYear: 1928, deathYear: 1947, partners: [0] },
  { id: 2, name: "Nearco", parent1Id: 0, parent2Id: 1, gender: "man", country: "ITY", birthYear: 1935, deathYear: 1957, partners: [3] },
  { id: 3, name: "Lady angela", parent1Id: null, parent2Id: null, gender: "woman", country: "GB", birthYear: 1944, deathYear: 1966, partners: [2] },
  { id: 4, name: "Nearctic", parent1Id: 2, parent2Id: 3, gender: "man", country: "CAN", birthYear: 1954, deathYear: 1973, partners: [5] },
  { id: 5, name: "Natalma", parent1Id: null, parent2Id: null, gender: "woman", country: "USA", birthYear: 1957, deathYear: 1985, partners: [4] },
  { id: 6, name: "Northern dancer", parent1Id: 4, parent2Id: 5, gender: "man", country: "CAN", birthYear: 1961, deathYear: 1990, partners: [7] },
  { id: 7, name: "South ocean", parent1Id: null, parent2Id: null, gender: "woman", country: "CAN", birthYear: 1967, deathYear: 1989, partners: [6] },
  { id: 8, name: "Storm bird", parent1Id: 6, parent2Id: 7, gender: "man", country: "CAN", birthYear: 1978, deathYear: 2004, partners: [9] },
  { id: 9, name: "Terlingua", parent1Id: null, parent2Id: null, gender: "woman", country: "USA", birthYear: 1976, deathYear: 2008, partners: [8] },
  { id: 10, name: "Storm cat", parent1Id: 8, parent2Id: 9, gender: "man", country: "USA", birthYear: 1983, deathYear: 2013, partners: [11] },
  { id: 11, name: "Monevassia", parent1Id: null, parent2Id: null, gender: "woman", country: "USA", birthYear: 1994, deathYear: null, partners: [10] },
  { id: 12, name: "Loves only me", parent1Id: 10, parent2Id: 11, gender: "woman", country: "USA", birthYear: 2006, deathYear: null, partners: [13] },
  { id: 13, name: "Deep impact", parent1Id: null, parent2Id: null, gender: "man", country: "JPN", birthYear: 2002, deathYear: 2019, partners: [12] },
  { id: 14, name: "Real steel", parent1Id: 13, parent2Id: 12, gender: "man", country: "JPN", birthYear: 2012, deathYear: null, partners: [15] },
  { id: 15, name: "Forever darling", parent1Id: null, parent2Id: null, gender: "woman", country: "USA", birthYear: 2013, deathYear: null, partners: [14] },
  { id: 16, name: "Forever young", parent1Id: 14, parent2Id: 15, gender: "man", country: "JPN", birthYear: 2019, deathYear: null, partners: [] }
]



;

export const targetPersonId = 0;