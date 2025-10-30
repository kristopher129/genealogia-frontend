import React from "react";
import PropTypes from 'prop-types';
import HorseForm, { SEXO } from "./HorseForm";
import {
  RESET_BUTTON_STYLE,
  DELETE_BUTTON_STYLE,
  EDIT_FIELD_CONTAINER_STYLE,
  EDIT_LABEL_STYLE,
  EDIT_INPUT_STYLE,
  EDIT_SELECT_STYLE,
  SAVE_BUTTON_STYLE,
  SECONDARY_ACTION_BUTTON_STYLE,
  TAB_LIST_STYLE,
  TAB_BUTTON_STYLE,
  TAB_BUTTON_ACTIVE_STYLE,
  TAB_CONTENT_STYLE,
} from "./familyTreeConstants";

const tabs = [
  { id: "edit", label: "Editar" },
  { id: "add", label: "Agregar" },
  { id: "export", label: "Exportar/Importar" },
];

const FamilyTreePanel = ({
  selectedHorseName,
  activeTab,
  onTabChange,
  editName,
  onEditNameChange,
  editSex,
  onEditSexChange,
  isEditDisabled,
  onEditSubmit,
  onDeleteHorse,
  hasSelectedHorse,
  horseFormProps,
  manualHelper,
  onExport,
  onImportClick,
  onImportChange,
  fileInputRef,
  onReset,
}) => {
  const displayedHorseName = selectedHorseName ?? "Ninguno";
  const saveButtonStyle = {
    ...SAVE_BUTTON_STYLE,
    opacity: isEditDisabled ? 0.6 : 1,
    cursor: isEditDisabled ? "not-allowed" : "pointer",
  };
  const deleteButtonStyle = {
    ...DELETE_BUTTON_STYLE,
    opacity: hasSelectedHorse ? 1 : 0.6,
    cursor: hasSelectedHorse ? "pointer" : "not-allowed",
    marginBottom: 0,
  };

  return (
    <aside className="tree-layout__panel" aria-label="Panel de acciones">
      <div className="tree-layout__section">
        <h2 className="tree-layout__title">Gestión de caballos</h2>
        <p className="tree-layout__selected" style={{ marginBottom: "1rem" }}>
          Caballo seleccionado: <strong>{displayedHorseName}</strong>
        </p>
        <div style={TAB_LIST_STYLE} role="tablist" aria-label="Acciones de gestión">
          {tabs.map(({ id, label }) => {
            const isActive = activeTab === id;
            const style = isActive ? TAB_BUTTON_ACTIVE_STYLE : TAB_BUTTON_STYLE;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${id}`}
                id={`tab-${id}`}
                onClick={() => onTabChange(id)}
                style={style}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="tree-layout__section" style={TAB_CONTENT_STYLE}>
        {activeTab === "edit" && (
          <div role="tabpanel" id="tab-panel-edit" aria-labelledby="tab-edit">
            <div style={EDIT_FIELD_CONTAINER_STYLE}>
              <label style={EDIT_LABEL_STYLE} htmlFor="edit-name">
                Nombre
              </label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(event) => onEditNameChange(event.target.value)}
                style={EDIT_INPUT_STYLE}
                maxLength={50}
                placeholder="Nombre del caballo"
                disabled={!hasSelectedHorse}
              />
            </div>
            <div style={{ ...EDIT_FIELD_CONTAINER_STYLE, marginTop: 12 }}>
              <label style={EDIT_LABEL_STYLE} htmlFor="edit-sex">
                Sexo
              </label>
              <select
                id="edit-sex"
                value={editSex}
                onChange={(event) => onEditSexChange(event.target.value)}
                style={EDIT_SELECT_STYLE}
                disabled={!hasSelectedHorse}
              >
                <option value={SEXO.MACHO}>Macho</option>
                <option value={SEXO.HEMBRA}>Hembra</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              <button type="button" onClick={onEditSubmit} style={saveButtonStyle} disabled={isEditDisabled}>
                💾 Guardar cambios
              </button>
              <button type="button" onClick={onDeleteHorse} style={deleteButtonStyle} disabled={!hasSelectedHorse}>
                🗑️ Eliminar caballo
              </button>
            </div>
          </div>
        )}
        {activeTab === "add" && (
          <div role="tabpanel" id="tab-panel-add" aria-labelledby="tab-add">
            <HorseForm {...horseFormProps} />
          </div>
        )}
        {activeTab === "export" && (
          <div role="tabpanel" id="tab-panel-export" aria-labelledby="tab-export">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button type="button" onClick={onExport} style={SAVE_BUTTON_STYLE}>
                ⬇️ Exportar árbol
              </button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onImportChange} style={{ display: "none" }} />
              <button type="button" onClick={onImportClick} style={SECONDARY_ACTION_BUTTON_STYLE}>
                ⬆️ Importar árbol
              </button>
              {manualHelper && <p style={{ fontSize: 13, color: "#475467", marginTop: 4 }}>{manualHelper}</p>}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "#f9fafb",
          paddingTop: 16,
          marginTop: "auto",
        }}
      >
        <button type="button" onClick={onReset} style={RESET_BUTTON_STYLE}>
          🔄 Restablecer árbol
        </button>
      </div>
    </aside>
  );
};

export default FamilyTreePanel;

FamilyTreePanel.propTypes = {
  selectedHorseName: PropTypes.string,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  editName: PropTypes.string,
  onEditNameChange: PropTypes.func.isRequired,
  editSex: PropTypes.string,
  onEditSexChange: PropTypes.func.isRequired,
  isEditDisabled: PropTypes.bool,
  onEditSubmit: PropTypes.func.isRequired,
  onDeleteHorse: PropTypes.func.isRequired,
  hasSelectedHorse: PropTypes.bool,
  horseFormProps: PropTypes.object,
  manualHelper: PropTypes.string,
  onExport: PropTypes.func.isRequired,
  onImportClick: PropTypes.func.isRequired,
  onImportChange: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object,
  onReset: PropTypes.func.isRequired,
};

FamilyTreePanel.defaultProps = {
  selectedHorseName: null,
  editName: "",
  editSex: "macho",
  isEditDisabled: false,
  hasSelectedHorse: false,
  horseFormProps: {},
  manualHelper: "",
  fileInputRef: null,
};
