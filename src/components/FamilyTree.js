import React from "react";
import { RELATION_TYPES, SEXO } from "./HorseForm";
import FamilyTreePanel from "./FamilyTreePanel";
import {
  useFamilyTreeComponentEffects,
  usePersistTreeDataEffect,
} from "./familyTreeEffects";
import { sanitizeStoredMembers } from "../utils/helpers";
import { STORAGE_KEY } from "./familyTreeConstants";
import "../styles/dtree.css";
import { useFamilyTreeState } from "../hooks/useFamilyTreeState";

const FamilyTree = () => {
  const state = useFamilyTreeState();
  const {
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
  } = state;
  usePersistTreeDataEffect({
    treeData,
    storageKey: STORAGE_KEY,
    sanitizeStoredMembers,
  });
  useFamilyTreeComponentEffects({
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
  });

  return (
    <div className="family-tree-container">
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">Cargando árbol genealógico...</div>
      )}

      <div className="tree-layout">
        <FamilyTreePanel
          selectedHorseName={selectedHorseName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          editName={editName}
          onEditNameChange={setEditName}
          editSex={editSex}
          onEditSexChange={setEditSex}
          isEditDisabled={isEditDisabled}
          onEditSubmit={handleEditHorseSubmit}
          onDeleteHorse={handleDeleteHorse}
          hasSelectedHorse={hasSelectedHorse}
          horseFormProps={horseFormProps}
          manualHelper={manualHelper}
          onExport={handleExportTree}
          onImportClick={handleImportButtonClick}
          onImportChange={handleImportTree}
          fileInputRef={fileInputRef}
          onReset={handleResetTree}
        />

        <div
          id="graph-container"
          className={`graph-container${
            isLoading ? " graph-container--hidden" : ""
          }`}
        >
          <div
            id="graph"
            ref={graphRef}
            className="graph"
            role="region"
            aria-label="Visualización del árbol genealógico"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;
