import { useEffect } from "react";

export const usePersistTreeDataEffect = ({
  treeData,
  storageKey,
  sanitizeStoredMembers,
}) => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(sanitizeStoredMembers(treeData))
      );
    } catch {}
  }, [treeData, sanitizeStoredMembers, storageKey]);
};

export const useFamilyTreeComponentEffects = ({
  treeData,
  setSelectedHorseId,
  selectedHorseId,
  setChildParents,
  selectedFather,
  selectedMother,
  childPartnerOptions,
  selectedChildPartnerId,
  selectedHorse,
  setSelectedChildPartnerId,
  activeRelationType,
  canonicalGender,
  RELATION_TYPES,
  SEXO,
  setEditName,
  setEditSex,
  setEditCountry,
  setEditBirthYear,
  setEditDeathYear,
  setFatherSearch,
  setMotherSearch,
  resizeTimeoutRef,
  graphRef,
  setDimensions,
}) => {
  useEffect(() => {
    if (treeData.length === 0) {
      setSelectedHorseId(null);
      return;
    }
    if (!treeData.some((member) => member.id === selectedHorseId)) {
      setSelectedHorseId(treeData[0].id);
    }
  }, [treeData, selectedHorseId, setSelectedHorseId]);

  useEffect(() => {
    setChildParents((prev) => {
      const fatherExists =
        prev.fatherId != null &&
        treeData.some((member) => member.id === prev.fatherId);
      const motherExists =
        prev.motherId != null &&
        treeData.some((member) => member.id === prev.motherId);
      const nextFather = fatherExists ? prev.fatherId : null;
      const nextMother = motherExists ? prev.motherId : null;
      if (nextFather === prev.fatherId && nextMother === prev.motherId) {
        return prev;
      }
      return { fatherId: nextFather, motherId: nextMother };
    });
  }, [treeData, setChildParents]);

  useEffect(() => {
    if (!selectedHorse) {
      if (selectedChildPartnerId != null) {
        setSelectedChildPartnerId(null);
      }
      return;
    }
    if (
      selectedChildPartnerId != null &&
      !childPartnerOptions.some(
        (partner) => partner.id === selectedChildPartnerId
      )
    ) {
      setSelectedChildPartnerId(null);
    }
  }, [
    childPartnerOptions,
    selectedChildPartnerId,
    selectedHorse,
    setSelectedChildPartnerId,
  ]);

  useEffect(() => {
    if (
      activeRelationType !== RELATION_TYPES.HIJO &&
      selectedChildPartnerId != null
    ) {
      setSelectedChildPartnerId(null);
    }
  }, [
    activeRelationType,
    selectedChildPartnerId,
    setSelectedChildPartnerId,
    RELATION_TYPES,
  ]);

  useEffect(() => {
    if (selectedFather?.name) {
      setFatherSearch(selectedFather.name);
    }
  }, [selectedFather, setFatherSearch]);

  useEffect(() => {
    if (selectedMother?.name) {
      setMotherSearch(selectedMother.name);
    }
  }, [selectedMother, setMotherSearch]);

  useEffect(() => {
    if (!selectedHorse) {
      setEditName("");
      setEditSex(SEXO.MACHO);
      setEditCountry("");
      setEditBirthYear("");
      setEditDeathYear("");
      return;
    }
    setEditName(selectedHorse.name ?? "");
    setEditCountry(selectedHorse.country ?? "");
    setEditBirthYear(selectedHorse.birthYear != null ? String(selectedHorse.birthYear) : "");
    setEditDeathYear(selectedHorse.deathYear != null ? String(selectedHorse.deathYear) : "");
    const canonical = canonicalGender(selectedHorse.gender);
    if (canonical === "woman") {
      setEditSex(SEXO.HEMBRA);
    } else {
      setEditSex(SEXO.MACHO);
    }
  }, [
    selectedHorse,
    canonicalGender,
    setEditName,
    setEditSex,
    setEditCountry,
    setEditBirthYear,
    setEditDeathYear,
    SEXO.HEMBRA,
    SEXO.MACHO,
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        const container =
          graphRef?.current?.parentElement ?? document.documentElement;
        const newWidth =
          container?.clientWidth ?? document.documentElement.clientWidth;
        const newHeight =
          container?.clientHeight ?? document.documentElement.clientHeight;

        setDimensions({
          width: newWidth,
          height: newHeight,
        });
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [graphRef, resizeTimeoutRef, setDimensions]);
};
