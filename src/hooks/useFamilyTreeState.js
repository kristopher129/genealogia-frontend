// hooks/useFamilyTreeState.js
import { useMemo, useState, useRef, useCallback } from "react";
import { RELATION_TYPES, SEXO } from "../components/HorseForm";
import {
  initializeTreeData,
  ensurePartnersArray,
  sanitizeStoredMembers,
  synchronizePartners,
  getDefaultTreeData,
  useFamilyTreeLoader,
} from "../utils/helpers";
import { targetPersonId } from "../data/familyTreeData";
import addHorse, {
  removeHorse,
  addPartnerToHorse,
} from "../utils/HorseFunctions";
import { STORAGE_KEY } from "../components/familyTreeConstants";

export function useFamilyTreeState() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const resizeTimeoutRef = useRef(null);
  const [treeData, setTreeData] = useState(() => initializeTreeData());
  const [selectedHorseId, setSelectedHorseId] = useState(targetPersonId);
  const [activeRelationType, setActiveRelationType] = useState(
    RELATION_TYPES.HIJO
  );
  const [childParents, setChildParents] = useState({
    fatherId: null,
    motherId: null,
  });
  const [selectedChildPartnerId, setSelectedChildPartnerId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSex, setEditSex] = useState(SEXO.MACHO);
  const [activeTab, setActiveTab] = useState("edit");
  const [manualHelper, setManualHelper] = useState("");
  const fileInputRef = useRef(null);
  const dSeederOptions = useMemo(
    () => ({
      class: (member) => member.gender,
      textClass: () => "",
      extra: (member) => ({ nickname: member.nickname, originalId: member.id }),
    }),
    []
  );
  const selectedHorse = useMemo(
    () => treeData.find((member) => member.id === selectedHorseId) ?? null,
    [treeData, selectedHorseId]
  );
  const selectedFather = useMemo(
    () =>
      treeData.find((member) => member.id === childParents.fatherId) ?? null,
    [treeData, childParents.fatherId]
  );
  const selectedMother = useMemo(
    () =>
      treeData.find((member) => member.id === childParents.motherId) ?? null,
    [treeData, childParents.motherId]
  );
  const childPartnerOptions = useMemo(() => {
    if (!selectedHorse) {
      return [];
    }
    return ensurePartnersArray(selectedHorse.partners)
      .map((partnerId) => treeData.find((member) => member.id === partnerId))
      .filter(Boolean);
  }, [selectedHorse, treeData]);
  const selectedChildPartner = useMemo(
    () =>
      childPartnerOptions.find((partner) => partner.id === selectedChildPartnerId) ?? null,
    [childPartnerOptions, selectedChildPartnerId]
  );
  const availableParentSlot = useMemo(() => {
    if (!selectedHorse) {
      return null;
    }
    if (selectedHorse.parent1Id == null) {
      return { field: "parent1Id", sex: SEXO.MACHO };
    }
    if (selectedHorse.parent2Id == null) {
      return { field: "parent2Id", sex: SEXO.HEMBRA };
    }
    return null;
  }, [selectedHorse]);
  const isMale = useCallback((gender) => {
    if (!gender) {
      return false;
    }
    const value = String(gender).toLowerCase();
    return value === "macho" || value === "man" || value === "male";
  }, []);
  const isFemale = useCallback((gender) => {
    if (!gender) {
      return false;
    }
    const value = String(gender).toLowerCase();
    return value === "hembra" || value === "woman" || value === "female";
  }, []);
  const canonicalGender = useCallback(
    (gender) => {
      if (isMale(gender)) {
        return "man";
      }
      if (isFemale(gender)) {
        return "woman";
      }
      return null;
    },
    [isFemale, isMale]
  );
  const oppositeGender = useCallback(
    (gender) => {
      const canonical = canonicalGender(gender);
      if (canonical === "man") {
        return "woman";
      }
      if (canonical === "woman") {
        return "man";
      }
      return null;
    },
    [canonicalGender]
  );
  const ensureAutomaticChild = useCallback(
    (membersList, firstParentId, secondParentId) => {
      if (!Array.isArray(membersList)) {
        return { members: membersList, childName: null };
      }
      const firstParent = membersList.find((member) => member.id === firstParentId);
      const secondParent = membersList.find((member) => member.id === secondParentId);
      if (!firstParent || !secondParent) {
        return { members: membersList, childName: null };
      }
      const firstGender = canonicalGender(firstParent.gender);
      const secondGender = canonicalGender(secondParent.gender);
      if (!firstGender || !secondGender || firstGender === secondGender) {
        return { members: membersList, childName: null };
      }
      let fatherId = null;
      let motherId = null;
      if (firstGender === "man") {
        fatherId = firstParent.id;
      }
      if (firstGender === "woman") {
        motherId = firstParent.id;
      }
      if (secondGender === "man") {
        fatherId = secondParent.id;
      }
      if (secondGender === "woman") {
        motherId = secondParent.id;
      }
      if (fatherId == null || motherId == null) {
        return { members: membersList, childName: null };
      }
      const existingChild = membersList.some((member) => {
        if (member.parent1Id == null || member.parent2Id == null) {
          return false;
        }
        const parent1 = Number(member.parent1Id);
        const parent2 = Number(member.parent2Id);
        return (
          (parent1 === fatherId && parent2 === motherId) ||
          (parent1 === motherId && parent2 === fatherId)
        );
      });
      if (existingChild) {
        return { members: membersList, childName: null };
      }
      const childName = `Cría de ${firstParent.name} y ${secondParent.name}`;
      const membersWithChild = addHorse(membersList, {
        name: childName,
        parent1Id: fatherId,
        parent2Id: motherId,
        gender: "man",
        partners: [],
      });
      return { members: membersWithChild, childName };
    },
    [canonicalGender]
  );
  const handleNodeClick = useCallback(
    (name, extra, id) => {
      const rawId = extra?.originalId ?? id;
      if (rawId == null) {
        return;
      }
      const horseId = Number(rawId);
      if (Number.isNaN(horseId)) {
        return;
      }

      setSelectedHorseId(horseId);

      if (activeRelationType === RELATION_TYPES.HIJO) {
        const member = treeData.find((item) => item.id === horseId);
        if (!member) {
          return;
        }

        const assignFather = isMale(member.gender);
        const assignMother = isFemale(member.gender);

        if (!assignFather && !assignMother) {
          return;
        }

        if (
          selectedHorse &&
          ensurePartnersArray(selectedHorse.partners).includes(horseId)
        ) {
          setSelectedChildPartnerId(horseId);
        }

        setChildParents((prev) => {
          if (assignFather && prev.fatherId === horseId) {
            return prev;
          }
          if (assignMother && prev.motherId === horseId) {
            return prev;
          }
          const next = {
            ...prev,
            ...(assignFather ? { fatherId: horseId } : {}),
            ...(assignMother ? { motherId: horseId } : {}),
          };
          if (
            !assignFather &&
            assignMother &&
            selectedHorse &&
            ensurePartnersArray(selectedHorse.partners).includes(horseId)
          ) {
            setSelectedChildPartnerId(horseId);
          }
          if (
            assignFather &&
            !assignMother &&
            selectedHorse &&
            ensurePartnersArray(selectedHorse.partners).includes(horseId)
          ) {
            setSelectedChildPartnerId(horseId);
          }
          if (next.fatherId && next.motherId) {
            setManualHelper("");
          }
          return next;
        });
      }
    },
    [
      activeRelationType,
      isFemale,
      isMale,
      selectedHorse,
      setChildParents,
      setManualHelper,
      treeData,
    ]
  );
  const defaultHelperMessage = useMemo(() => {
    if (activeRelationType === RELATION_TYPES.HIJO) {
      if (childPartnerOptions.length > 1 && !selectedChildPartner) {
        return "Selecciona una pareja para registrar la cría.";
      }
      if (!selectedFather && !selectedMother) {
        return "Selecciona un padre y una madre en el árbol.";
      }
      if (!selectedFather) {
        return "Selecciona un caballo macho como padre.";
      }
      if (!selectedMother) {
        return "Selecciona un caballo hembra como madre.";
      }
      const baseMessage = `Se agregará una cría para ${selectedFather.name} y ${selectedMother.name}.`;
      if (childPartnerOptions.length > 1 && selectedChildPartner) {
        return `${baseMessage} Pareja seleccionada: ${selectedChildPartner.name}.`;
      }
      return baseMessage;
    }

    if (!selectedHorse) {
      return "Selecciona un caballo en el árbol.";
    }

    if (activeRelationType === RELATION_TYPES.PADRE) {
      if (!availableParentSlot) {
        return `${selectedHorse.name} ya tiene ambos progenitores registrados.`;
      }
      const label = availableParentSlot.sex === SEXO.MACHO ? "macho" : "hembra";
      return `Se agregará un progenitor ${label} para ${selectedHorse.name}.`;
    }

    if (activeRelationType === RELATION_TYPES.PAREJA) {
      if (!selectedHorse) {
        return "Selecciona un caballo para registrar una pareja.";
      }
      const partnerCount = ensurePartnersArray(selectedHorse.partners).length;
      if (partnerCount === 0) {
        return `Se agregará la primera pareja para ${selectedHorse.name}.`;
      }
      return `${selectedHorse.name} tiene ${partnerCount} parejas registradas. Se agregará una nueva pareja.`;
    }

    return "";
  }, [
    activeRelationType,
    availableParentSlot,
    childPartnerOptions,
    selectedChildPartner,
    selectedFather,
    selectedHorse,
    selectedMother,
  ]);
  const helperMessage = manualHelper || defaultHelperMessage;

  const isChildReady = selectedFather != null && selectedMother != null;

  const lockedParentSex =
    activeRelationType === RELATION_TYPES.PADRE
      ? availableParentSlot?.sex ?? null
      : null;
  const parentDisabled = !availableParentSlot;
  const partnerDisabled = false;
  const isEditDisabled = !selectedHorse || editName.trim().length === 0;

  const mapSexToGender = useCallback(
    (sex) => (sex === SEXO.MACHO ? "man" : "woman"),
    []
  );

  const handleChildPartnerSelect = useCallback((partnerId) => {
    setSelectedChildPartnerId(partnerId);
  }, []);

  const handleRelationTypeChange = useCallback(
    (type) => {
      setActiveRelationType(type);
      setManualHelper("");
      if (type !== RELATION_TYPES.HIJO) {
        setChildParents({ fatherId: null, motherId: null });
        setSelectedChildPartnerId(null);
      }
    },
    [setChildParents]
  );

  const handleExportTree = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const sanitized = sanitizeStoredMembers(treeData);
      const json = JSON.stringify(sanitized, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `genealogia-arbol-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setManualHelper("Árbol exportado correctamente.");
    } catch {
      setManualHelper("No se pudo exportar el árbol.");
    }
  }, [setManualHelper, treeData]);

  const handleImportTree = useCallback(
    async (event) => {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) {
        input.value = "";
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        // Support two shapes: an array of members, or an object { members: [] }
        const inputData = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.members) ? parsed.members : null;
        if (!inputData) {
          setManualHelper("El archivo no contiene datos válidos (se esperaba un array o { members: [] }).");
          return;
        }
        const sanitized = sanitizeStoredMembers(inputData);
        if (sanitized.length === 0) {
          setManualHelper("El archivo no contiene datos válidos.");
          return;
        }
        setTreeData(sanitized);
        const existingSelection =
          sanitized.find((member) => member.id === selectedHorseId)?.id ?? null;
        const fallbackSelection = sanitized[0]?.id ?? null;
        setSelectedHorseId(existingSelection ?? fallbackSelection);
        setChildParents({ fatherId: null, motherId: null });
        setSelectedChildPartnerId(null);
        setActiveRelationType(RELATION_TYPES.HIJO);
        setManualHelper(`Árbol importado desde ${file.name}.`);
      } catch {
        setManualHelper(
          "No se pudo importar el archivo. Verifica que sea un JSON válido."
        );
      } finally {
        input.value = "";
      }
    },
    [
      selectedHorseId,
      setActiveRelationType,
      setChildParents,
      setManualHelper,
      setSelectedChildPartnerId,
      setSelectedHorseId,
      setTreeData,
    ]
  );

  const handleImportButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleResetTree = useCallback(() => {
    const defaultData = getDefaultTreeData();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setTreeData(defaultData);
    setSelectedHorseId(targetPersonId);
    setChildParents({ fatherId: null, motherId: null });
    setManualHelper("Árbol restablecido a los valores iniciales.");
    setActiveRelationType(RELATION_TYPES.HIJO);
  }, [
    setActiveRelationType,
    setChildParents,
    setManualHelper,
    setSelectedHorseId,
    setTreeData,
  ]);

  const handleDeleteHorse = useCallback(() => {
    if (!selectedHorse) {
      setManualHelper("Selecciona un caballo para eliminar.");
      return;
    }
    try {
      const horseId = selectedHorse.id;
      const horseName = selectedHorse.name;
      const updated = removeHorse(treeData, horseId);
      const nextSelectedId = updated.length > 0 ? updated[0].id : null;
      setTreeData(updated);
      setSelectedHorseId(nextSelectedId);
      setChildParents((prev) => {
        const nextFather = prev.fatherId === horseId ? null : prev.fatherId;
        const nextMother = prev.motherId === horseId ? null : prev.motherId;
        if (nextFather === prev.fatherId && nextMother === prev.motherId) {
          return prev;
        }
        return { fatherId: nextFather, motherId: nextMother };
      });
      setManualHelper(`Caballo eliminado: ${horseName}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el caballo.";
      setManualHelper(message);
    }
  }, [
    selectedHorse,
    setChildParents,
    setManualHelper,
    setSelectedHorseId,
    setTreeData,
    treeData,
  ]);

  const handleEditHorseSubmit = useCallback(() => {
    if (!selectedHorse) {
      setManualHelper("Selecciona un caballo para editar.");
      return;
    }
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setManualHelper("Ingresa un nombre válido para actualizar.");
      return;
    }
    const nextGender = mapSexToGender(editSex);
    const updatedTree = treeData.map((member) =>
      member.id === selectedHorse.id
        ? { ...member, name: trimmedName, gender: nextGender }
        : member
    );
    setTreeData(updatedTree);
    setSelectedHorseId(selectedHorse.id);
    setEditName(trimmedName);
    setChildParents((prev) => {
      let nextFather = prev.fatherId;
      let nextMother = prev.motherId;
      if (prev.fatherId === selectedHorse.id && nextGender !== "man") {
        nextFather = null;
      }
      if (prev.motherId === selectedHorse.id && nextGender !== "woman") {
        nextMother = null;
      }
      if (nextFather === prev.fatherId && nextMother === prev.motherId) {
        return prev;
      }
      return { fatherId: nextFather, motherId: nextMother };
    });
    setManualHelper(`Caballo actualizado: ${trimmedName}.`);
  }, [
    editName,
    editSex,
    mapSexToGender,
    selectedHorse,
    setChildParents,
    setManualHelper,
    setSelectedHorseId,
    setTreeData,
    treeData,
  ]);

  const handleHorseSubmit = useCallback(
    ({ name, sex, relationType }) => {
      if (!selectedHorse) {
        setManualHelper("Selecciona un caballo para continuar.");
        return;
      }

      const normalizedGender = mapSexToGender(sex);

      if (relationType === RELATION_TYPES.PAREJA) {
        const expectedPartnerGender = oppositeGender(selectedHorse.gender);
        if (!expectedPartnerGender) {
          setManualHelper(
            "El caballo seleccionado requiere un género válido para registrar parejas."
          );
          return;
        }
        const partnerName = name.trim();
        const existingPartner = treeData.find(
          (member) => member.name.toLowerCase() === partnerName.toLowerCase()
        );
        if (existingPartner) {
          try {
            const existingCanonical = canonicalGender(existingPartner.gender);
            if (
              existingCanonical &&
              existingCanonical !== expectedPartnerGender
            ) {
              setManualHelper(
                "La pareja existente debe tener género opuesto al caballo seleccionado."
              );
              return;
            }
            let updatedMembers = addPartnerToHorse(
              treeData,
              selectedHorse.id,
              existingPartner.id
            );
            if (!existingCanonical) {
              updatedMembers = updatedMembers.map((member) => {
                if (member.id === existingPartner.id) {
                  return { ...member, gender: expectedPartnerGender };
                }
                return member;
              });
            }
            const synchronized = synchronizePartners(
              updatedMembers,
              selectedHorse.id,
              existingPartner.id
            );
            const withExisting = synchronizePartners(
              synchronized,
              selectedHorse.id,
              existingPartner.id
            );
            const { members: withChild, childName } = ensureAutomaticChild(
              withExisting,
              selectedHorse.id,
              existingPartner.id
            );
            setTreeData(withChild);
            setSelectedHorseId(selectedHorse.id);
            const helperText = childName
              ? `Pareja registrada: ${existingPartner.name}. Cría agregada automáticamente: ${childName}.`
              : `Pareja registrada: ${existingPartner.name}.`;
            setManualHelper(helperText);
            if (activeRelationType === RELATION_TYPES.HIJO) {
              setChildParents({ fatherId: null, motherId: null });
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudo registrar la nueva pareja.";
            setManualHelper(message);
          }
          return;
        }
        console.log(`[PARTNER CREATION] Adding partner "${name}" to horse "${selectedHorse.name}" (ID: ${selectedHorse.id})`);
        const membersWithPartner = addHorse(treeData, {
          name,
          parent1Id: null,
          parent2Id: null,
          gender: expectedPartnerGender,
          partners: [selectedHorse.id],
        });
        const createdPartner =
          membersWithPartner[membersWithPartner.length - 1];
        if (createdPartner?.id == null) {
          setManualHelper("No se pudo registrar la nueva pareja.");
          return;
        }
        console.log(`[PARTNER CREATION] Created partner with ID: ${createdPartner.id}`);
        const synchronized = synchronizePartners(
          membersWithPartner,
          selectedHorse.id,
          createdPartner.id
        );
        const withExisting = synchronizePartners(
          synchronized,
          selectedHorse.id,
          createdPartner.id
        );
        const { members: withChild, childName } = ensureAutomaticChild(
          withExisting,
          selectedHorse.id,
          createdPartner.id
        );
        console.log(`[TREE UPDATE] Setting treeData with ${withChild.length} members`);
        console.log(`[TREE UPDATE] Members:`, withChild.map(m => ({id: m.id, name: m.name})));
        setTreeData(withChild);
        setSelectedHorseId(selectedHorse.id);
        const helperText = childName
          ? `Pareja agregada: ${name}. Cría agregada automáticamente: ${childName}.`
          : `Pareja agregada: ${name}.`;
        setManualHelper(helperText);
        if (activeRelationType === RELATION_TYPES.HIJO) {
          setChildParents({ fatherId: null, motherId: null });
        }
        return;
      }

      if (relationType === RELATION_TYPES.HIJO) {
        if (!selectedFather || !selectedMother) {
          setManualHelper("Selecciona padre y madre antes de agregar la cría.");
          return;
        }

        const father = isMale(selectedFather.gender) ? selectedFather.id : null;
        const mother = isFemale(selectedMother.gender)
          ? selectedMother.id
          : null;

        if (father == null || mother == null) {
          setManualHelper("Verifica que el padre sea macho y la madre hembra.");
          return;
        }

        const updatedMembers = addHorse(treeData, {
          name,
          parent1Id: father,
          parent2Id: mother,
          gender: normalizedGender,
        });
        const createdHorse = updatedMembers[updatedMembers.length - 1];
        const synchronized = synchronizePartners(
          updatedMembers,
          father,
          mother
        );

        setTreeData(synchronized);
        if (createdHorse?.id != null) {
          setSelectedHorseId(createdHorse.id);
        }
        setManualHelper(`Cría agregada: ${name}.`);
        return;
      }

      if (relationType === RELATION_TYPES.PADRE) {
        if (!availableParentSlot) {
          setManualHelper(
            `${selectedHorse.name} ya tiene ambos progenitores registrados.`
          );
          return;
        }

        const membersWithParent = addHorse(treeData, {
          name,
          parent1Id: null,
          parent2Id: null,
          gender: normalizedGender,
        });
        const createdParent = membersWithParent[membersWithParent.length - 1];
        if (createdParent?.id == null) {
          setManualHelper("No se pudo registrar el nuevo progenitor.");
          return;
        }

        const otherParentId =
          availableParentSlot.field === "parent1Id"
            ? selectedHorse.parent2Id
            : selectedHorse.parent1Id;
        const updatedTree = membersWithParent.map((member) =>
          member.id === selectedHorse.id
            ? { ...member, [availableParentSlot.field]: createdParent.id }
            : member
        );
        const synchronized =
          otherParentId != null
            ? synchronizePartners(updatedTree, createdParent.id, otherParentId)
            : updatedTree;

        setTreeData(synchronized);
        setManualHelper(`Progenitor agregado para ${selectedHorse.name}.`);
        return;
      }
    },
    [
      availableParentSlot,
      canonicalGender,
      isFemale,
      isMale,
      mapSexToGender,
      oppositeGender,
      selectedFather,
      selectedHorse,
      selectedMother,
      treeData,
      ensureAutomaticChild,
      activeRelationType,
    ]
  );

  const handleCancel = useCallback(() => {
    setManualHelper("");
    if (activeRelationType === RELATION_TYPES.HIJO) {
      setChildParents({ fatherId: null, motherId: null });
    }
  }, [activeRelationType, setChildParents]);
  const selectedHorseName = selectedHorse?.name ?? "";
  const selectedFatherName = selectedFather?.name ?? "";
  const selectedMotherName = selectedMother?.name ?? "";
  const hasSelectedHorse = selectedHorse != null;
  const horseFormProps = {
    onSubmit: handleHorseSubmit,
    onCancel: handleCancel,
    lockedParentSex,
    parentDisabled,
    partnerDisabled,
    selectedHorseName,
    selectedFatherName,
    selectedMotherName,
    isChildReady,
    onRelationTypeChange: handleRelationTypeChange,
    helperMessage,
    childPartnerOptions,
    selectedChildPartnerId,
    onChildPartnerSelect: handleChildPartnerSelect,
  };

  const loaderResult = useFamilyTreeLoader({
    data: treeData,
    targetId: targetPersonId,
    options: dSeederOptions,
    dimensions,
    onNodeClick: handleNodeClick,
  }) || {};
  const { graphRef, isLoading, error } = loaderResult;



  return {
    treeData,
    setSelectedHorseId,
    selectedHorseId,
    setChildParents,
    childPartnerOptions,
    selectedChildPartnerId,
    selectedHorse,
    setSelectedChildPartnerId,
    activeRelationType,
    canonicalGender,
    setEditName,
    setEditSex,
    resizeTimeoutRef,
    graphRef,
    setDimensions,
    activeTab,
    setActiveTab,
    editName,
    editSex,
    manualHelper,
    fileInputRef,
    isEditDisabled,
    handleExportTree,
    handleImportTree,
    handleImportButtonClick,
    handleResetTree,
    handleDeleteHorse,
    handleEditHorseSubmit,
    selectedHorseName,
    hasSelectedHorse,
    horseFormProps,
    isLoading,
    error,
  };
}
