import { seedFamilyTreeData } from "../treeSeed";

const findNodeById = (nodes, targetId) => {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    for (const marriage of node.marriages || []) {
      if (marriage.spouse?.id === targetId) {
        return marriage.spouse;
      }

      const childMatch = findNodeById(marriage.children || [], targetId);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return null;
};

describe("seedFamilyTreeData", () => {
  test("preserva el vínculo con los padres cuando un hijo también forma una nueva familia", () => {
    const data = [
      { id: 0, name: "Padre", parent1Id: null, parent2Id: null, gender: "man", partners: [1] },
      { id: 1, name: "Madre", parent1Id: null, parent2Id: null, gender: "woman", partners: [0] },
      { id: 2, name: "Hijo", parent1Id: 0, parent2Id: 1, gender: "man", partners: [3] },
      { id: 3, name: "Pareja", parent1Id: null, parent2Id: null, gender: "woman", partners: [2] },
      { id: 4, name: "HermanoA", parent1Id: 2, parent2Id: 3, gender: "man", partners: [5] },
      { id: 5, name: "HermanaB", parent1Id: 2, parent2Id: 3, gender: "woman", partners: [4] },
      { id: 6, name: "Cria", parent1Id: 4, parent2Id: 5, gender: "man", partners: [] },
    ];

    const seeded = seedFamilyTreeData(data, 0, {
      class: (member) => member.gender,
      textClass: () => "",
      extra: (member) => ({ originalId: member.id }),
    });

    expect(seeded).toHaveLength(1);

    const root = seeded[0];
    expect(root.id).toBe(0);
    expect(root.marriages[0].spouse.id).toBe(1);

    const childNode = findNodeById(root.marriages[0].children, 2);
    expect(childNode).toBeTruthy();

    const siblingA = findNodeById(root.marriages[0].children, 4);
    const siblingB = findNodeById(root.marriages[0].children, 5);
    expect(siblingA).toBeTruthy();
    expect(siblingB).toBeTruthy();

    expect(siblingA.marriages).toHaveLength(1);
    expect(siblingA.marriages[0].spouse.id).toBe(5);
    expect(siblingA.marriages[0].children.map((child) => child.id)).toContain(6);

    const siblingBInsideParents = childNode.marriages[0].children.find(
      (child) => child.id === 5
    );
    expect(siblingBInsideParents).toBeTruthy();
  });
});
