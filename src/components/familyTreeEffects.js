import { useEffect } from "react";

// Escape user-provided strings to avoid injecting raw HTML into node renderers.
const escapeHtml = (unsafe) => {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const useFamilyTreeLoaderEffects = ({
  onNodeClick,
  onNodeClickRef,
  loadTreeLibraries,
  data,
  targetId,
  options,
  width,
  height,
  setStatus,
  graphRef,
  treeInstanceRef,
  ensurePartnersArray,
}) => {
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick, onNodeClickRef]);

  useEffect(() => {
    let isMounted = true;
  // Copy mutable refs/DOM nodes to local variables here. This ensures
  // the cleanup function below operates on the exact DOM node and tree
  // instance that this effect created. If we read `graphRef.current`
  // directly inside the cleanup, its value may have changed (React may
  // have re-rendered and assigned a different node), which leads to
  // both incorrect cleanup and an ESLint warning (react-hooks/exhaustive-deps).
  // By capturing the values here we guarantee deterministic cleanup.
  const initialContainer = graphRef?.current ?? null;
  const initialTreeInstanceRef = treeInstanceRef;

    const renderTree = async () => {
      setStatus({ isLoading: true, error: null });

      try {
        const { d3, dTree, dSeeder } = await loadTreeLibraries();
        const prevTransform = (() => {
          const container = graphRef.current;
          if (!container) {
            return null;
          }
          const svgSelection = d3.select(container).select("svg");
          const groupSelection = svgSelection.select("g");
          if (!svgSelection.node() || !groupSelection.node()) {
            return null;
          }
          const computedTransform = d3.zoomTransform(svgSelection.node());
          if (computedTransform.k === 1 && computedTransform.x === 0 && computedTransform.y === 0) {
            const match = groupSelection.attr("transform")?.match(/matrix\(([^)]+)\)/);
            if (match) {
              return d3.zoomIdentity.matrix(match[1].split(/[\s,]+/).map(Number));
            }
          }
          return computedTransform;
        })();

        if (!isMounted || !graphRef.current) {
          return;
        }

        if (!d3 || !dTree || !dSeeder) {
          throw new Error("No se pudieron cargar las librerías d3, dTree o dSeeder");
        }

        const rawCopy = data.map((member) => ({ ...member, partners: ensurePartnersArray(member.partners).slice() }));
        const knownIds = new Set(rawCopy.map((member) => member.id));
        const dataCopy = rawCopy.map((member) => ({
          ...member,
          parent1Id: knownIds.has(member.parent1Id) ? member.parent1Id : null,
          parent2Id: knownIds.has(member.parent2Id) ? member.parent2Id : null,
          partners: ensurePartnersArray(member.partners).filter((partnerId) => knownIds.has(partnerId) && partnerId !== member.id),
        }));
        if (process.env.NODE_ENV === "development") {
          console.debug("📊 Datos enviados al dSeeder.seed:", dataCopy);
        }

        const seededData = dSeeder.seed(dataCopy, targetId, options);

  const preservedSvg = d3.select(initialContainer).select("svg");
  const preservedGroup = preservedSvg.select("g");

        if (!preservedSvg.empty() && !preservedGroup.empty()) {
          preservedGroup.attr("data-preserve", "true");
        }

        if (initialContainer) {
          initialContainer.innerHTML = "";
        }

        treeInstanceRef.current = dTree.init(seededData, {
          target: initialContainer,
          debug: false,
          height,
          width,
          callbacks: {
            nodeClick: (name, extra, id) => {
              onNodeClickRef.current?.(name, extra, id);
              const svgSelection = d3.select(initialContainer).select("svg");
              const groupSelection = svgSelection.select("g");
              if (!svgSelection.node() || !groupSelection.node()) {
                return;
              }
              const currentTransform = d3.zoomTransform(svgSelection.node());
              svgSelection.property("__zoom", currentTransform);
              groupSelection.attr("transform", currentTransform.toString());
            },
            textRenderer: (name, extra, textClass) => {
              const safeName = escapeHtml(name);
              const safeNick = extra?.nickname ? ` (${escapeHtml(extra.nickname)})` : "";
              const displayName = `${safeName}${safeNick}`;
              return `<p align='center' class='${textClass}' role="heading" aria-level="3">${displayName}</p>`;
            },
            nodeRenderer: (name, x, y, nodeHeight, nodeWidth, extra, id, nodeClass, textClass, textRenderer) => `
              <div 
                class="${nodeClass}" 
                id="node${id}"
                role="button"
                tabindex="0"
                aria-label="Miembro familiar: ${escapeHtml(name)}"
              >
                ${textRenderer(name, extra, textClass)}
              </div>
            `,
          },
        });

        if (prevTransform && initialContainer) {
          const svgSelection = d3.select(initialContainer).select("svg");
          const groupSelection = svgSelection.select("g");
          if (svgSelection.node() && groupSelection.node()) {
            svgSelection.property("__zoom", prevTransform);
            groupSelection.attr("transform", prevTransform.toString());
          }
        }

        if (isMounted) {
          setStatus({ isLoading: false, error: null });
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setStatus({ isLoading: false, error: `Error al renderizar el árbol: ${message}` });
        }
      }
    };

    renderTree();

      return () => {
      isMounted = false;
      const treeInstance = initialTreeInstanceRef?.current ?? null;
      const container = initialContainer;

      if (treeInstance?.destroy) {
        treeInstance.destroy();
      }

      if (container) {
        container.innerHTML = "";
      }
    };
  }, [data, targetId, options, width, height, ensurePartnersArray, loadTreeLibraries, onNodeClickRef, setStatus, graphRef, treeInstanceRef]);
};

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
      const fatherExists = prev.fatherId != null && treeData.some((member) => member.id === prev.fatherId);
      const motherExists = prev.motherId != null && treeData.some((member) => member.id === prev.motherId);
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
    if (selectedChildPartnerId != null && !childPartnerOptions.some((partner) => partner.id === selectedChildPartnerId)) {
      setSelectedChildPartnerId(null);
    }
  }, [childPartnerOptions, selectedChildPartnerId, selectedHorse, setSelectedChildPartnerId]);

  useEffect(() => {
    if (activeRelationType !== RELATION_TYPES.HIJO) {
      if (selectedChildPartnerId != null) {
        setSelectedChildPartnerId(null);
      }
      return;
    }
    if (!selectedHorse) {
      if (selectedChildPartnerId != null) {
        setSelectedChildPartnerId(null);
      }
      setChildParents((prev) => {
        if (prev.fatherId == null && prev.motherId == null) {
          return prev;
        }
        return { fatherId: null, motherId: null };
      });
      return;
    }
    let partnerToUse = childPartnerOptions.find((partner) => partner.id === selectedChildPartnerId) ?? null;
    if (!partnerToUse && childPartnerOptions.length > 0) {
      const selectedCanonical = canonicalGender(selectedHorse.gender);
      const defaultPartner =
        childPartnerOptions.find((candidate) => {
          const candidateCanonical = canonicalGender(candidate.gender);
          return candidateCanonical && selectedCanonical && candidateCanonical !== selectedCanonical;
        }) ?? childPartnerOptions[0];
      if (defaultPartner) {
        partnerToUse = defaultPartner;
        if (selectedChildPartnerId !== defaultPartner.id) {
          setSelectedChildPartnerId(defaultPartner.id);
        }
      }
    }
    if (!partnerToUse) {
      const selectedCanonical = canonicalGender(selectedHorse.gender);
      const nextState = {
        fatherId: selectedCanonical === "man" ? selectedHorse.id : null,
        motherId: selectedCanonical === "woman" ? selectedHorse.id : null,
      };
      setChildParents((prev) => {
        if (prev.fatherId === nextState.fatherId && prev.motherId === nextState.motherId) {
          return prev;
        }
        return nextState;
      });
      return;
    }
    const selectedCanonical = canonicalGender(selectedHorse.gender);
    const partnerCanonical = canonicalGender(partnerToUse.gender);
    let fatherId = null;
    let motherId = null;
    if (selectedCanonical === "man") {
      fatherId = selectedHorse.id;
    }
    if (selectedCanonical === "woman") {
      motherId = selectedHorse.id;
    }
    if (partnerCanonical === "man") {
      fatherId = partnerToUse.id;
    }
    if (partnerCanonical === "woman") {
      motherId = partnerToUse.id;
    }
    if (fatherId == null) {
      fatherId = partnerToUse.id !== motherId ? partnerToUse.id : selectedHorse.id;
    }
    if (motherId == null) {
      motherId = partnerToUse.id !== fatherId ? partnerToUse.id : selectedHorse.id;
    }
    if (fatherId === motherId) {
      if (selectedCanonical === "woman") {
        fatherId = partnerToUse.id;
        motherId = selectedHorse.id;
      } else {
        fatherId = selectedHorse.id;
        motherId = partnerToUse.id;
      }
      if (fatherId === motherId) {
        motherId = null;
      }
    }
    const nextState = { fatherId, motherId };
    setChildParents((prev) => {
      if (prev.fatherId === nextState.fatherId && prev.motherId === nextState.motherId) {
        return prev;
      }
      return nextState;
    });
  }, [activeRelationType, canonicalGender, childPartnerOptions, selectedChildPartnerId, selectedHorse, setChildParents, setSelectedChildPartnerId, RELATION_TYPES]);

  useEffect(() => {
    if (!selectedHorse) {
      setEditName("");
      setEditSex(SEXO.MACHO);
      return;
    }
    setEditName(selectedHorse.name ?? "");
    const canonical = canonicalGender(selectedHorse.gender);
    if (canonical === "woman") {
      setEditSex(SEXO.HEMBRA);
    } else {
      setEditSex(SEXO.MACHO);
    }
  }, [selectedHorse, canonicalGender, setEditName, setEditSex, SEXO.HEMBRA, SEXO.MACHO]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        const container = graphRef?.current?.parentElement ?? document.documentElement;
        const newWidth = container?.clientWidth ?? document.documentElement.clientWidth;
        const newHeight = container?.clientHeight ?? document.documentElement.clientHeight;

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
