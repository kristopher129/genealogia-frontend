let placeholderSpouseSequence = -1;

const cloneMember = (member) => (member ? { ...member } : null);

const getWithParentIds = (data, id, { required = true } = {}) => {
  const member = data.find((item) => item.id === id);
  if (!member) {
    if (!required) {
      return null;
    }
    throw new Error(`Member with id (${id}) was not found`);
  }
  return cloneMember(member);
};

const getWithoutParentIds = (data, id, options) => {
  const member = getWithParentIds(data, id, options);
  if (!member) {
    return null;
  }
  member.parent1Id = null;
  member.parent2Id = null;
  return member;
};

const getMembers = (data, ids, { preserveParentIds }) =>
  ids
    .filter((id) => id != null)
    .map((id) =>
      preserveParentIds
        ? getWithParentIds(data, id, { required: false })
        : getWithoutParentIds(data, id, { required: false })
    )
    .filter(Boolean);

const getChildren = (data, ...parents) => {
  const childIds = data
    .filter((member) =>
      parents.some(
        (parent) => parent.id === member.parent1Id || parent.id === member.parent2Id
      )
    )
    .map((member) => member.id);

  if (childIds.length === 0) {
    return [];
  }

  const children = getMembers(data, childIds, { preserveParentIds: true });
  const parentDepthOffset = parents.find((parent) => parent.depthOffset != null)?.depthOffset;

  if (parentDepthOffset != null) {
    children.forEach((child) => {
      // d3-dtree inserts `depthOffset` hidden nodes before each person (see dTree._preprocess).
      // Incrementing per generation (parent + 1) stacks extra vertical levels so spacing grows
      // toward the leaves; inherit the parent's value so each generation uses the same step.
      child.depthOffset = parentDepthOffset;
    });
  }

  return children;
};

const getOtherParents = (data, children, ...parents) => {
  const parentIds = parents.map((parent) => parent.id);
  const otherParentIds = children.map((child) =>
    parentIds.includes(child.parent1Id) ? child.parent2Id : child.parent1Id
  );
  const uniqueOtherParentIds = otherParentIds.filter(
    (value, index) => value != null && index === otherParentIds.indexOf(value)
  );
  const otherParents = getMembers(data, uniqueOtherParentIds, {
    preserveParentIds: false,
  });
  const parentDepthOffset = parents.find((parent) => parent.depthOffset != null)?.depthOffset;

  if (parentDepthOffset != null) {
    otherParents.forEach((otherParent) => {
      otherParent.depthOffset = parentDepthOffset;
    });
  }

  return otherParents;
};

const getRelatives = (data, targetId) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data cannot be empty");
  }
  if (targetId == null) {
    throw new Error("TargetId cannot be undefined");
  }

  const depthOffsetStart = 1;
  const members = [];
  const target = getWithParentIds(data, targetId);
  const hasParent1 = target.parent1Id != null;
  const hasParent2 = target.parent2Id != null;

  if (!hasParent1 && !hasParent2) {
    target.depthOffset = depthOffsetStart;
  } else {
    target.depthOffset = depthOffsetStart + 1;
    const parentIds = [];
    if (hasParent1) {
      parentIds.push(target.parent1Id);
    }
    if (hasParent2) {
      parentIds.push(target.parent2Id);
    }
    const parents = getMembers(data, parentIds, { preserveParentIds: false });
    parents.forEach((parent) => {
      parent.depthOffset = depthOffsetStart;
    });
    members.push(...parents);

    const siblingIds = data
      .filter(
        (member) =>
          ((member.parent1Id === target.parent1Id || member.parent2Id === target.parent2Id) ||
            (member.parent1Id === target.parent2Id || member.parent2Id === target.parent1Id)) &&
          member.id !== target.id
      )
      .map((member) => member.id);
    const siblings = getMembers(data, siblingIds, { preserveParentIds: true });
    siblings.forEach((sibling) => {
      sibling.depthOffset = depthOffsetStart + 1;
    });
    members.push(...siblings);
  }

  members.push(target);

  const children = getChildren(data, target);
  members.push(...children);
  if (children.length === 0) {
    return members;
  }

  const otherParents = getOtherParents(data, children, target);
  members.push(...otherParents);

  let nextGeneration = children;
  while (nextGeneration.length > 0) {
    const nextGenerationChildren = getChildren(data, ...nextGeneration);
    members.push(...nextGenerationChildren);

    const nextGenerationOtherParents = getOtherParents(
      data,
      nextGenerationChildren,
      ...nextGeneration
    );
    members.push(...nextGenerationOtherParents);

    nextGeneration = nextGenerationChildren;
  }

  return members;
};

const createTreeNode = (member, options) => {
  if (!member) {
    return null;
  }

  return {
    id: member.id,
    name: member.name ?? "",
    class: options?.class?.(member) ?? "",
    textClass: options?.textClass?.(member) ?? "",
    depthOffset: member.depthOffset ?? -1,
    marriages: [],
    extra: options?.extra?.(member) ?? {},
  };
};

const createPlaceholderSpouse = (member, options) => ({
  id: placeholderSpouseSequence--,
  name: "",
  class: "placeholder-spouse",
  textClass: "placeholder-spouse-text",
  depthOffset: member?.depthOffset ?? -1,
  marriages: [],
  extra: {
    ...(options?.extra?.(member) ?? {}),
    isPlaceholder: true,
    originalId: null,
  },
});

const createMarriage = () => ({
  spouse: null,
  children: [],
});

const overwriteChild = (marriage, newChild) => {
  const index = marriage.children.findIndex((child) => child.id === newChild.id);
  if (index !== -1) {
    marriage.children.splice(index, 1, newChild);
  }
};

const canInsertAsDescendant = (node, descendent) => {
  if (node.id === descendent.id) {
    return false;
  }

  for (let index = 0; index < node.marriages.length; index += 1) {
    const marriage = node.marriages[index];

    if (marriage.spouse?.id === descendent.id) {
      return false;
    }

    if (marriage.children.some((child) => child.id === descendent.id)) {
      overwriteChild(marriage, descendent);
      return true;
    }

    if (marriage.children.some((child) => canInsertAsDescendant(child, descendent))) {
      return true;
    }
  }

  return false;
};

const combineIntoMarriages = (data, options) => {
  if (data.length === 1) {
    return data.map((member) => createTreeNode(member, options));
  }

  let parentGroups = data
    .map((member) => [member.parent1Id, member.parent2Id].filter((id) => id != null))
    .filter((group) => group.length > 0);

  parentGroups = [
    ...new Set(parentGroups.map((group) => JSON.stringify([...group].sort((a, b) => a - b)))),
  ].map((group) => JSON.parse(group));

  if (parentGroups.length === 0) {
    throw new Error("At least one member must have at least one parent");
  }

  const treeNodes = [];

  while (parentGroups.length > 0) {
    const currentParentGroup = parentGroups[0];
    const nodeId = currentParentGroup[0];
    const nodeMember = getWithParentIds(data, nodeId, { required: false });
    const node = createTreeNode(nodeMember, options);
    if (!nodeMember || !node) {
      parentGroups = parentGroups.filter(
        (group) => JSON.stringify(group) !== JSON.stringify(currentParentGroup)
      );
      continue;
    }
    const nodeMarriages = parentGroups.filter((group) => group.includes(nodeId));
    const processedGroups = new Set();

    nodeMarriages.forEach((marriedCouple) => {
      processedGroups.add(JSON.stringify(marriedCouple));
      const marriage = createMarriage();
      const spouseId = marriedCouple[1];

      if (spouseId != null) {
        marriage.spouse = createTreeNode(
          getWithParentIds(data, spouseId, { required: false }),
          options
        );
      }

      if (!marriage.spouse) {
        marriage.spouse = createPlaceholderSpouse(nodeMember, options);
      }

      marriage.children = data
        .filter((member) => {
          if (member.parent1Id != null && member.parent2Id != null) {
            return (
              marriedCouple.includes(member.parent1Id) &&
              marriedCouple.includes(member.parent2Id)
            );
          }
          if (member.parent1Id != null && member.parent2Id == null) {
            return marriedCouple.includes(member.parent1Id);
          }
          if (member.parent1Id == null && member.parent2Id != null) {
            return marriedCouple.includes(member.parent2Id);
          }
          return false;
        })
        .map((child) => createTreeNode(child, options))
        .filter(Boolean);

      node.marriages.push(marriage);
    });

    parentGroups = parentGroups.filter(
      (group) => !processedGroups.has(JSON.stringify(group))
    );
    treeNodes.push(node);
  }

  return treeNodes;
};

const coalesce = (data) => {
  if (data.length === 0) {
    throw new Error("Data cannot be empty");
  }
  if (data.length === 1) {
    return data;
  }

  let count = 0;
  while (data.length > 1) {
    for (let index = 0; index < data.length; index += 1) {
      const node = data[index];
      const otherNodes = data.filter((otherNode) => otherNode !== node);

      if (otherNodes.some((otherNode) => canInsertAsDescendant(otherNode, node))) {
        data.splice(index, 1);
        index -= 1;
      }
    }

    count += 1;
    if (count > 100) {
      throw new Error("Data contains multiple roots or spans more than 100 generations.");
    }
  }

  return data;
};

export const seedFamilyTreeData = (data, targetId, options) => {
  placeholderSpouseSequence = -1;
  const members = getRelatives(data, targetId);
  const marriages = combineIntoMarriages(members, options);
  return coalesce(marriages);
};
