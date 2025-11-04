import { useEffect, useRef, useState } from 'react';
import { familyTreeData } from "../data/familyTreeData";
import { loadTreeLibraries } from "../utils/globalLibs";
import {  STORAGE_KEY} from "../components/familyTreeConstants"

export const ensurePartnersArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeNullableId = (value) => {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

export const sanitizeStoredMembers = (members) => {
  if (!Array.isArray(members)) {
    return [];
  }
  const result = [];
  members.forEach((member) => {
    if (!member || member.id == null) {
      return;
    }
    const id = Number(member.id);
    if (Number.isNaN(id)) {
      return;
    }
    const parent1Id = normalizeNullableId(member.parent1Id);
    const parent2Id = normalizeNullableId(member.parent2Id);
    const partners = Array.from(
      new Set(
        ensurePartnersArray(member.partners)
          .map((partnerId) => Number(partnerId))
          .filter((partnerId) => !Number.isNaN(partnerId) && partnerId !== id)
      )
    );
    result.push({ ...member, id, parent1Id, parent2Id, partners });
  });
  return result;
};

export const getDefaultTreeData = () => sanitizeStoredMembers(familyTreeData);

export const mergeWithDefaultMembers = (storedMembers) => {
  const defaults = getDefaultTreeData();
  if (!Array.isArray(storedMembers) || storedMembers.length === 0) {
    return defaults;
  }
  const mergedMap = new Map(defaults.map((member) => [member.id, member]));
  storedMembers.forEach((member) => {
    if (!member || member.id == null) {
      return;
    }
    const existing = mergedMap.get(member.id);
    if (!existing) {
      mergedMap.set(member.id, member);
      return;
    }
    const partners = Array.from(
      new Set([
        ...ensurePartnersArray(existing.partners),
        ...ensurePartnersArray(member.partners),
      ])
    );
    mergedMap.set(member.id, {
      ...existing,
      ...member,
      partners,
    });
  });
  return Array.from(mergedMap.values());
};

export const initializeTreeData = () => {
  if (typeof window === "undefined") {
    return getDefaultTreeData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultTreeData();
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeStoredMembers(parsed);
    const merged = mergeWithDefaultMembers(sanitized);
    if (merged.length === 0) {
      return getDefaultTreeData();
    }
    return merged;
  } catch (error) {
    return getDefaultTreeData();
  }
};

export const appendPartner = (member, partnerId) => {
  if (partnerId == null || member?.id == null) {
    return member;
  }
  const partners = ensurePartnersArray(member.partners);
  if (partners.includes(partnerId)) {
    if (member.partners === partners) {
      return member;
    }
    return { ...member, partners };
  }
  return { ...member, partners: [...partners, partnerId] };
};

export const synchronizePartners = (members, firstId, secondId) => {
  if (firstId == null || secondId == null || firstId === secondId) {
    return members;
  }
  return members.map((member) => {
    if (member.id === firstId) {
      return appendPartner(member, secondId);
    }
    if (member.id === secondId) {
      return appendPartner(member, firstId);
    }
    return member;
  });
};

// Escape user-provided strings to avoid injecting raw HTML when the
// renderer builds node HTML fragments.
export const escapeHtml = (unsafe) => {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const fixNodeSpouses = (node, originalDataMap) => {
  if (!node || !Array.isArray(node.marriages)) {
    return node;
  }

  const originalMember = originalDataMap.get(node.id);
  const partnerIds = originalMember ? ensurePartnersArray(originalMember.partners) : [];
  const usedSpouseIds = new Set();

  console.log(`[FIXING] Fixing spouses for node ${node.name} (ID: ${node.id}), partners: [${partnerIds.join(', ')}]`);

  const fixedMarriages = node.marriages.map((marriage, index) => {
    if (!marriage || !marriage.spouse) {
      return marriage;
    }

    let spouse = marriage.spouse;
    const originalSpouseMember = originalDataMap.get(spouse.id);

    console.log(`[FIXING] Marriage ${index}: current spouse ${spouse.name} (ID: ${spouse.id}, gender: ${spouse.gender}), used spouses: [${Array.from(usedSpouseIds).join(', ')}]`);

    // If the spouse ID is not in the partners array or is the node itself, find the correct partner
    if (!partnerIds.includes(spouse.id) || spouse.id === node.id) {
      console.log(`[FIXING] Spouse ID ${spouse.id} is invalid, finding correct partner...`);
      // Find an unused partner ID
      const availablePartners = partnerIds.filter(id => !usedSpouseIds.has(id) && id !== node.id);
      console.log(`[FIXING] Available partners: [${availablePartners.join(', ')}]`);
      if (availablePartners.length > 0) {
        const correctSpouseId = availablePartners[0];
        const correctSpouseMember = originalDataMap.get(correctSpouseId);
        console.log(`[FIXING] Correcting spouse to ${correctSpouseMember?.name} (ID: ${correctSpouseId}, gender: ${correctSpouseMember?.gender})`);
        if (correctSpouseMember) {
          // For corrected spouses, use the gender from the original member
          spouse = {
            id: correctSpouseId,
            name: correctSpouseMember.name,
            gender: correctSpouseMember.gender,
            nickname: correctSpouseMember.nickname,
          };
          console.log(`[FIXING] Created corrected spouse: ${spouse.name} (ID: ${spouse.id}, gender: ${spouse.gender})`);
        }
      }
    }

    // Mark this spouse ID as used
    usedSpouseIds.add(spouse.id);

    // Update the name, gender and nickname if we have the original member data
    if (originalSpouseMember && spouse.id === originalSpouseMember.id) {
      console.log(`[FIXING] Updating existing spouse ${spouse.name} with original data (gender: ${originalSpouseMember.gender})`);
      spouse = {
        ...spouse,
        name: originalSpouseMember.name,
        gender: originalSpouseMember.gender,
        nickname: originalSpouseMember.nickname,
      };
      console.log(`[FIXING] Updated spouse: ${spouse.name} (ID: ${spouse.id}, gender: ${spouse.gender})`);
    }

    // Recursively fix children
    const fixedChildren = marriage.children.map(child => fixNodeSpouses(child, originalDataMap));

    return {
      ...marriage,
      spouse,
      children: fixedChildren,
    };
  });

  return {
    ...node,
    marriages: fixedMarriages,
  };
};

export const fixMultipleSpouseNames = (seededData, originalDataMap) => {
  if (!Array.isArray(seededData)) {
    return seededData;
  }

  return seededData.map((node) => fixNodeSpouses(node, originalDataMap));
};

export const useFamilyTreeLoader = ({ data, targetId, options, dimensions, onNodeClick }) => {
  const graphRef = useRef(null);
  const treeInstanceRef = useRef(null);
  const onNodeClickRef = useRef(onNodeClick);
  const [status, setStatus] = useState({ isLoading: true, error: null });
  const { width, height } = dimensions;

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
  // Copy refs/DOM nodes to local variables to guarantee the cleanup
  // function operates on the same nodes/instances that were used to
  // render the tree in this particular effect invocation. Accessing
  // `graphRef.current` directly in the cleanup can be racy because
  // React may have updated the ref to point at a different DOM node
  // by the time cleanup runs. Capturing them here keeps cleanup
  // deterministic and silences exhaustive-deps warnings.
  let isMounted = true;
  const initialContainer = graphRef.current ?? null;
  const initialTreeInstanceRef = treeInstanceRef;

    const renderTree = async () => {
      setStatus({ isLoading: true, error: null });

      try {
        const { d3, dTree, dSeeder } = await loadTreeLibraries();
        const prevTransform = (() => {
          if (!graphRef.current) {
            return null;
          }
          const svgSelection = d3.select(graphRef.current).select("svg");
          const groupSelection = svgSelection.select("g");
          if (!svgSelection.node() || !groupSelection.node()) {
            return null;
          }
          const computedTransform = d3.zoomTransform(svgSelection.node());
          if (computedTransform.k === 1 && computedTransform.x === 0 && computedTransform.y === 0) {
            const match = groupSelection.attr("transform")?.match(/matrix\(([^)]+)\)/);
            if (match) {
              return d3.zoomIdentity.matrix(match[1].split(/[,\s]+/).map(Number));
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
        if (process.env.NODE_ENV === 'development') {
          console.debug("📊 Datos enviados al dSeeder.seed:", dataCopy);
        }

        console.log(`[SEEDING] Starting seeding with targetId: ${targetId}`);
        console.log(`[SEEDING] dataCopy members:`, dataCopy.map(m => ({id: m.id, name: m.name})));

        const seededData = dSeeder.seed(dataCopy, targetId, options);

        const printTree = (node, depth = 0) => {
          const indent = '  '.repeat(depth);
          console.log(`${indent}Node: ${node.name} (ID: ${node.id})`);
          node.marriages.forEach((marriage, idx) => {
            console.log(`${indent}  Marriage ${idx}:`);
            if (marriage.spouse) {
              console.log(`${indent}    Spouse: ${marriage.spouse.name} (ID: ${marriage.spouse.id})`);
            }
            marriage.children.forEach(child => {
              printTree(child, depth + 2);
            });
          });
        };

        console.log(`[SEEDING] Seeded data structure:`);
        seededData.forEach(node => printTree(node));

        // Create a map of original data for fixing spouse names
        const originalDataMap = new Map(dataCopy.map(member => [member.id, member]));
        const fixedSeededData = fixMultipleSpouseNames(seededData, originalDataMap);

        // Update classes for corrected spouses
        const updateNodeClasses = (node) => {
          if (node && Array.isArray(node.marriages)) {
            node.marriages.forEach(marriage => {
              if (marriage.spouse) {
                // Update spouse class based on corrected gender
                marriage.spouse.class = marriage.spouse.gender;
                console.log(`[CLASS UPDATE] Updated spouse ${marriage.spouse.name} class to: ${marriage.spouse.class}`);
              }
              // Recursively update children
              marriage.children.forEach(updateNodeClasses);
            });
          }
        };

        fixedSeededData.forEach(updateNodeClasses);

        console.log(`[SEEDING] Fixed seeded data:`, fixedSeededData.map(node => ({
          id: node.id,
          name: node.name,
          marriages: node.marriages.map(m => ({
            spouse: m.spouse ? { id: m.spouse.id, name: m.spouse.name } : null
          }))
        })));

        const preservedSvg = d3.select(initialContainer).select("svg");
        const preservedGroup = preservedSvg.select("g");

        if (!preservedSvg.empty() && !preservedGroup.empty()) {
          preservedGroup.attr("data-preserve", "true");
        }

        if (initialContainer) {
          initialContainer.innerHTML = "";
        }

        treeInstanceRef.current = dTree.init(fixedSeededData, {
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

      if (initialTreeInstanceRef.current?.destroy) {
        initialTreeInstanceRef.current.destroy();
      }

      if (initialContainer) {
        initialContainer.innerHTML = "";
      }
    };
  }, [data, targetId, options, width, height]);

  return {
    graphRef,
    isLoading: status.isLoading,
    error: status.error,
  };
};
