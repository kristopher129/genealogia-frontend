import React, { useState, useEffect, useMemo, useId } from "react";
import PropTypes from 'prop-types';

export const RELATION_TYPES = {
  HIJO: "child",
  PADRE: "parent",
  PAREJA: "partner",
};

export const SEXO = {
  MACHO: "macho",
  HEMBRA: "hembra",
};

const FORM_STYLES = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
    maxWidth: 400,
  },
  relationsButtons: {
    display: "flex",
    gap: 8,
    justifyContent: "space-between",
  },
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 6,
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    fontSize: 14,
  },
  characterCounter: {
    marginTop: 4,
    fontSize: 12,
    color: "#667085",
    textAlign: "right",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    fontSize: 14,
    backgroundColor: "#ffffff",
    color: "#101828",
  },
  description: {
    marginTop: 6,
    fontSize: 12,
    color: "#475467",
    textAlign: "left",
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
  },
  helper: {
    fontSize: 12,
    minHeight: 18,
    textAlign: "left",
  },
  searchGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
};

const BUTTON_STYLES = {
  small: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    backgroundColor: "#ffffff",
    color: "#101828",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  smallActive: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #7f56d9",
    backgroundColor: "#f4ebff",
    color: "#53389e",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  primary: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#7f56d9",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #d0d5dd",
    backgroundColor: "#ffffff",
    color: "#101828",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};

const RELATION_BUTTONS = [
  { type: RELATION_TYPES.HIJO, emoji: "🐣", label: "Cría" },
  { type: RELATION_TYPES.PADRE, emoji: "🧬", label: "Progenitor" },
  { type: RELATION_TYPES.PAREJA, emoji: "❤️", label: "Pareja" },
];
const HorseForm = ({
  onSubmit,
  onCancel,
  lockedParentSex,
  parentDisabled,
  partnerDisabled,
  selectedHorseName,
  selectedFatherName,
  selectedMotherName,
  isChildReady,
  onRelationTypeChange,
  helperMessage,
  childPartnerOptions,
  selectedChildPartnerId,
  onChildPartnerSelect,
  fatherSearch,
  motherSearch,
  maleHorseOptions,
  femaleHorseOptions,
  onFatherSearchChange,
  onMotherSearchChange,
  onFatherSelect,
  onMotherSelect,
}) => {
  const [relationType, setRelationType] = useState(RELATION_TYPES.HIJO);
  const [formName, setFormName] = useState("");
  const [formSex, setFormSex] = useState(SEXO.MACHO);
  const [formCountry, setFormCountry] = useState("");
  const [formBirthYear, setFormBirthYear] = useState("");
  const [formDeathYear, setFormDeathYear] = useState("");
  const datalistBaseId = useId();

  useEffect(() => {
    onRelationTypeChange?.(RELATION_TYPES.HIJO);
  }, [onRelationTypeChange]);

  useEffect(() => {
    if (relationType === RELATION_TYPES.PADRE && lockedParentSex) {
      setFormSex(lockedParentSex);
    }
  }, [relationType, lockedParentSex]);

  const handleRelationClick = (type) => {
    if (type === RELATION_TYPES.PADRE && parentDisabled) {
      return;
    }
    if (type === RELATION_TYPES.PAREJA && partnerDisabled) {
      return;
    }
    setRelationType(type);
    if (type === RELATION_TYPES.PADRE && lockedParentSex) {
      setFormSex(lockedParentSex);
    }
    if (type !== RELATION_TYPES.PADRE && formSex === lockedParentSex) {
      setFormSex(SEXO.MACHO);
    }
    onRelationTypeChange?.(type);
  };

  const handleSubmit = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      return;
    }
    if (relationType === RELATION_TYPES.HIJO && !isChildReady) {
      return;
    }
    const payload = {
      name: trimmedName,
      sex: relationType === RELATION_TYPES.PADRE && lockedParentSex ? lockedParentSex : formSex,
      relationType,
      country: formCountry.trim() || null,
      birthYear: formBirthYear ? Number(formBirthYear) : null,
      deathYear: formDeathYear ? Number(formDeathYear) : null,
    };
    onSubmit?.(payload);
    setFormName("");
    setFormCountry("");
    setFormBirthYear("");
    setFormDeathYear("");
  };

  const handleCancel = () => {
    setFormName("");
    setFormCountry("");
    setFormBirthYear("");
    setFormDeathYear("");
    onCancel?.();
  };

  const handleSexChange = (event) => {
    setFormSex(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isSubmitDisabled) {
      handleSubmit();
    }
  };

  const normalizeSearchValue = (value) => value.trim().toLowerCase();
  const filteredMaleOptions = useMemo(() => {
    const query = normalizeSearchValue(fatherSearch || "");
    if (!query) {
      return maleHorseOptions;
    }
    return maleHorseOptions.filter((horse) =>
      horse.name.toLowerCase().includes(query)
    );
  }, [fatherSearch, maleHorseOptions]);

  const filteredFemaleOptions = useMemo(() => {
    const query = normalizeSearchValue(motherSearch || "");
    if (!query) {
      return femaleHorseOptions;
    }
    return femaleHorseOptions.filter((horse) =>
      horse.name.toLowerCase().includes(query)
    );
  }, [femaleHorseOptions, motherSearch]);

  const isSubmitDisabled =
    formName.trim().length === 0 || (relationType === RELATION_TYPES.HIJO && !isChildReady);
  const helperColor = helperMessage ? "#b42318" : "#475467";
  return (
    <div style={FORM_STYLES.container}>
      <div>
        <div style={{ ...FORM_STYLES.label, marginBottom: 10 }}>Acción</div>
        <div style={FORM_STYLES.relationsButtons}>
          {RELATION_BUTTONS.map(({ type, emoji, label }) => {
            const isActive = relationType === type;
            const isDisabled =
              (type === RELATION_TYPES.PADRE && parentDisabled) ||
              (type === RELATION_TYPES.PAREJA && partnerDisabled);
            const baseStyle = isActive ? BUTTON_STYLES.smallActive : BUTTON_STYLES.small;
            const finalStyle = isDisabled
              ? { ...baseStyle, opacity: 0.5, cursor: "not-allowed" }
              : baseStyle;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleRelationClick(type)}
                style={finalStyle}
                disabled={isDisabled}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={FORM_STYLES.label}>Nombre</label>
        <input
          type="text"
          placeholder="Nombre del nuevo caballo"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          onKeyDown={handleKeyDown}
          style={FORM_STYLES.input}
          maxLength={50}
        />
        {formName.length > 0 && (
          <div style={FORM_STYLES.characterCounter}>{formName.length}/50</div>
        )}
      </div>

      {relationType !== RELATION_TYPES.PAREJA && (
        <div>
          <label style={FORM_STYLES.label}>Sexo</label>
          <select
            value={relationType === RELATION_TYPES.PADRE && lockedParentSex ? lockedParentSex : formSex}
            onChange={handleSexChange}
            onKeyDown={handleKeyDown}
            style={FORM_STYLES.select}
            disabled={relationType === RELATION_TYPES.PADRE && !!lockedParentSex}
          >
            <option value={SEXO.MACHO}>Macho</option>
            <option value={SEXO.HEMBRA}>Hembra</option>
          </select>
        </div>
      )}

      <div>
        <label style={FORM_STYLES.label}>País (Siglas)</label>
        <input
          type="text"
          placeholder="Ej: GBR, USA, ITY"
          value={formCountry}
          onChange={(e) => setFormCountry(e.target.value)}
          onKeyDown={handleKeyDown}
          style={FORM_STYLES.input}
          maxLength={3}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={FORM_STYLES.label}>Año Nac.</label>
          <input
            type="number"
            placeholder="Ej: 1940"
            value={formBirthYear}
            onChange={(e) => setFormBirthYear(e.target.value)}
            onKeyDown={handleKeyDown}
            style={FORM_STYLES.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={FORM_STYLES.label}>Año Fall.</label>
          <input
            type="number"
            placeholder="Ej: 1960"
            value={formDeathYear}
            onChange={(e) => setFormDeathYear(e.target.value)}
            onKeyDown={handleKeyDown}
            style={FORM_STYLES.input}
          />
        </div>
      </div>

      <div style={FORM_STYLES.description}>
        Caballo seleccionado: <strong>{selectedHorseName || "Ninguno"}</strong>
      </div>

      {relationType === RELATION_TYPES.HIJO && (
        <div
          style={{
            ...FORM_STYLES.description,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={FORM_STYLES.searchGroup}>
            <div>
              <label style={FORM_STYLES.label} htmlFor={`${datalistBaseId}-father`}>
                Padre
              </label>
              <input
                id={`${datalistBaseId}-father`}
                type="text"
                list={`${datalistBaseId}-father-list`}
                placeholder="Escribe el nombre de un macho"
                value={fatherSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  onFatherSearchChange?.(value);
                  const selectedOption = maleHorseOptions.find(
                    (horse) => horse.name === value
                  );
                  if (selectedOption) {
                    onFatherSelect?.(selectedOption.id);
                  }
                }}
                style={FORM_STYLES.input}
              />
              <datalist id={`${datalistBaseId}-father-list`}>
                {filteredMaleOptions.map((horse) => (
                  <option key={horse.id} value={horse.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label style={FORM_STYLES.label} htmlFor={`${datalistBaseId}-mother`}>
                Madre
              </label>
              <input
                id={`${datalistBaseId}-mother`}
                type="text"
                list={`${datalistBaseId}-mother-list`}
                placeholder="Escribe el nombre de una hembra"
                value={motherSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  onMotherSearchChange?.(value);
                  const selectedOption = femaleHorseOptions.find(
                    (horse) => horse.name === value
                  );
                  if (selectedOption) {
                    onMotherSelect?.(selectedOption.id);
                  }
                }}
                style={FORM_STYLES.input}
              />
              <datalist id={`${datalistBaseId}-mother-list`}>
                {filteredFemaleOptions.map((horse) => (
                  <option key={horse.id} value={horse.name} />
                ))}
              </datalist>
            </div>
          </div>
          {childPartnerOptions.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Pareja seleccionada:</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {childPartnerOptions.map((partner) => {
                  const isSelected = partner.id === selectedChildPartnerId;
                  const style = isSelected ? BUTTON_STYLES.smallActive : BUTTON_STYLES.small;
                  return (
                    <button
                      key={partner.id}
                      type="button"
                      style={style}
                      onClick={() => onChildPartnerSelect?.(partner.id)}
                    >
                      {partner.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <span>
            Padre seleccionado: <strong>{selectedFatherName || "Ninguno"}</strong>
          </span>
          <span>
            Madre seleccionada: <strong>{selectedMotherName || "Ninguna"}</strong>
          </span>
        </div>
      )}

      <div style={{ ...FORM_STYLES.helper, color: helperColor }}>{helperMessage || ""}</div>

      <div style={FORM_STYLES.buttonGroup}>
        <button type="button" style={{ ...BUTTON_STYLES.primary, opacity: isSubmitDisabled ? 0.6 : 1 }} onClick={handleSubmit} disabled={isSubmitDisabled}>
          ➕ Agregar
        </button>
        <button type="button" style={BUTTON_STYLES.secondary} onClick={handleCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default HorseForm;

HorseForm.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  lockedParentSex: PropTypes.string,
  parentDisabled: PropTypes.bool,
  partnerDisabled: PropTypes.bool,
  selectedHorseName: PropTypes.string,
  selectedFatherName: PropTypes.string,
  selectedMotherName: PropTypes.string,
  isChildReady: PropTypes.bool,
  onRelationTypeChange: PropTypes.func,
  helperMessage: PropTypes.string,
  childPartnerOptions: PropTypes.array,
  selectedChildPartnerId: PropTypes.number,
  onChildPartnerSelect: PropTypes.func,
  fatherSearch: PropTypes.string,
  motherSearch: PropTypes.string,
  maleHorseOptions: PropTypes.array,
  femaleHorseOptions: PropTypes.array,
  onFatherSearchChange: PropTypes.func,
  onMotherSearchChange: PropTypes.func,
  onFatherSelect: PropTypes.func,
  onMotherSelect: PropTypes.func,
};

HorseForm.defaultProps = {
  onSubmit: null,
  onCancel: null,
  lockedParentSex: null,
  parentDisabled: false,
  partnerDisabled: false,
  selectedHorseName: null,
  selectedFatherName: null,
  selectedMotherName: null,
  isChildReady: false,
  onRelationTypeChange: null,
  helperMessage: "",
  childPartnerOptions: [],
  selectedChildPartnerId: null,
  onChildPartnerSelect: null,
  fatherSearch: "",
  motherSearch: "",
  maleHorseOptions: [],
  femaleHorseOptions: [],
  onFatherSearchChange: null,
  onMotherSearchChange: null,
  onFatherSelect: null,
  onMotherSelect: null,
};
