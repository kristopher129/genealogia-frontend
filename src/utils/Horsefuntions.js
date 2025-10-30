const ensureId = (members, candidateId) => {
  if (candidateId != null) {
    return candidateId;
  }

  const maxId = members.reduce((max, member) => {
    const memberId = Number(member.id);
    if (Number.isNaN(memberId)) {
      return max;
    }
    return memberId > max ? memberId : max;
  }, -1);

  return maxId + 1;
};

const normalizePartners = (partners) => {
  if (!Array.isArray(partners)) {
    return [];
  }
  const unique = Array.from(new Set(partners.filter((partnerId) => partnerId != null)));
  return unique.map((partnerId) => Number(partnerId)).filter((partnerId) => !Number.isNaN(partnerId));
};

const buildHorse = (members, data) => {
  const { id, name,  parent1Id = null, parent2Id = null,gender, partners = [], ...rest } = data;
  if (!name || !gender) {
    throw new Error("El nuevo caballo requiere nombre y género");
  }
  const nextId = ensureId(members, id);
  return { id: nextId, name, parent1Id, parent2Id, gender, partners: normalizePartners(partners), ...rest };
};

const addHorse = (members, data) => {
  if (!Array.isArray(members)) {
    throw new Error("La lista de caballos debe ser un arreglo");
  }
  const horse = buildHorse(members, data);
  return [...members, horse];
};

const addPartnerToHorse = (members, horseId, partnerId) => {
  if (!Array.isArray(members)) {
    throw new Error("La lista de caballos debe ser un arreglo");
  }
  const targetId = Number(horseId);
  const partnerTargetId = Number(partnerId);
  if (Number.isNaN(targetId) || Number.isNaN(partnerTargetId)) {
    throw new Error("Los identificadores deben ser numéricos");
  }
  if (targetId === partnerTargetId) {
    throw new Error("Un caballo no puede ser su propia pareja");
  }
  const targetIndex = members.findIndex((member) => Number(member.id) === targetId);
  if (targetIndex === -1) {
    throw new Error("Caballo seleccionado no encontrado");
  }
  const partnerIndex = members.findIndex((member) => Number(member.id) === partnerTargetId);
  if (partnerIndex === -1) {
    throw new Error("La pareja no existe en el registro");
  }
  const targetPartners = normalizePartners(members[targetIndex].partners);
  const partnerPartners = normalizePartners(members[partnerIndex].partners);
  const nextTarget = {
    ...members[targetIndex],
    partners: normalizePartners([...targetPartners, partnerTargetId])
  };
  const nextPartner = {
    ...members[partnerIndex],
    partners: normalizePartners([...partnerPartners, targetId])
  };
  return members.map((member, index) => {
    if (index === targetIndex) {
      return nextTarget;
    }
    if (index === partnerIndex) {
      return nextPartner;
    }
    return member;
  });
};

const removeHorse = (members, horseId) => {
  if (!Array.isArray(members)) {
    throw new Error("La lista de caballos debe ser un arreglo");
  }
  const targetId = Number(horseId);
  if (Number.isNaN(targetId)) {
    throw new Error("El identificador del caballo debe ser numérico");
  }
  const exists = members.some((member) => Number(member.id) === targetId);
  if (!exists) {
    throw new Error("El caballo seleccionado no existe en el registro");
  }
  const filtered = members.filter((member) => Number(member.id) !== targetId);
  return filtered.map((member) => {
    const parent1 = member.parent1Id != null && Number(member.parent1Id) === targetId ? null : member.parent1Id;
    const parent2 = member.parent2Id != null && Number(member.parent2Id) === targetId ? null : member.parent2Id;
    const partners = normalizePartners(member.partners).filter((partnerId) => partnerId !== targetId);
    return { ...member, parent1Id: parent1, parent2Id: parent2, partners };
  });
};

export default addHorse;
export { addPartnerToHorse, removeHorse };
