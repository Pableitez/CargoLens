import {
  FACILITY_CODE_LENGTH,
  FACILITY_PORT_FUNCTION,
  FACILITY_SUGGESTED_FUNCTION_CODES,
  normalizeFacilityFunctionCode,
  parseFacilityCode,
} from "@shared/domain/facilityCode.js";
import { useAppTranslation } from "../i18n/useAppTranslation";
import { CountryCombobox } from "./CountryCombobox";

export type FacilityCodeFormSlice = {
  name: string;
  country: string;
  functionCode: string;
  code: string;
};

type FacilityCodeFieldsProps = {
  idPrefix: string;
  value: FacilityCodeFormSlice;
  onChange: (patch: Partial<FacilityCodeFormSlice>) => void;
  onCodeTouched: () => void;
  onSuggestReset: () => void;
};

export function FacilityCodeFields({
  idPrefix,
  value,
  onChange,
  onCodeTouched,
  onSuggestReset,
}: FacilityCodeFieldsProps) {
  const { t } = useAppTranslation();
  const isSuggested = FACILITY_SUGGESTED_FUNCTION_CODES.includes(value.functionCode);
  const isCustom = !isSuggested;
  const parsedCode = value.code.length === FACILITY_CODE_LENGTH ? parseFacilityCode(value.code) : null;

  function pickFunction(fn: string) {
    onSuggestReset();
    onChange({ functionCode: fn });
  }

  return (
    <div className="entity-code-fields field--span-12">
      <div className="party-profile__form-grid entity-code-fields__grid">
        <div className="field field--span-12">
          <label className="field__label" htmlFor={`${idPrefix}-name`}>
            {t("facilities.fieldName")} <span className="field__req">*</span>
          </label>
          <input
            id={`${idPrefix}-name`}
            className="field__input"
            value={value.name}
            onChange={(e) => {
              onSuggestReset();
              onChange({ name: e.target.value });
            }}
            placeholder={t("facilities.fieldNamePlaceholder")}
            required
          />
        </div>

        <div className="field field--span-12">
          <label className="field__label" htmlFor={`${idPrefix}-country`}>
            {t("tradeSetup.partyCountry")} <span className="field__req">*</span>
          </label>
          <CountryCombobox
            id={`${idPrefix}-country`}
            value={value.country}
            onChange={(country) => {
              onSuggestReset();
              onChange({ country });
            }}
            required
          />
        </div>

        <div className="field field--span-12">
          <span className="field__label" id={`${idPrefix}-function-label`}>
            {t("facilities.fieldFunctionLabel")}
          </span>
          <div
            className="entity-code-fields__function-grid"
            role="group"
            aria-labelledby={`${idPrefix}-function-label`}
          >
            {FACILITY_SUGGESTED_FUNCTION_CODES.map((fn) => (
              <button
                key={fn}
                type="button"
                className={`entity-code-fields__function-btn${
                  value.functionCode === fn ? " entity-code-fields__function-btn--active" : ""
                }${fn === FACILITY_PORT_FUNCTION ? " entity-code-fields__function-btn--trm" : ""}`}
                aria-pressed={value.functionCode === fn}
                onClick={() => pickFunction(fn)}
              >
                <span className="entity-code-fields__function-code">{fn}</span>
                <span className="entity-code-fields__function-name">
                  {t(`facilities.fieldFunctionShort.${fn}`)}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`entity-code-fields__function-btn${
                isCustom ? " entity-code-fields__function-btn--active" : ""
              }`}
              aria-pressed={isCustom}
              onClick={() => {
                onSuggestReset();
                onChange({ functionCode: "" });
              }}
            >
              <span className="entity-code-fields__function-code">···</span>
              <span className="entity-code-fields__function-name">{t("facilities.fieldFunctionCustom")}</span>
            </button>
          </div>
          {isCustom ? (
            <input
              id={`${idPrefix}-function-custom`}
              className="field__input field__input--compact-top"
              value={value.functionCode}
              onChange={(e) => {
                onSuggestReset();
                onChange({ functionCode: normalizeFacilityFunctionCode(e.target.value) });
              }}
              placeholder={t("facilities.fieldFunctionCustomPlaceholder")}
              maxLength={3}
              required
            />
          ) : null}
          {value.functionCode === FACILITY_PORT_FUNCTION ? (
            <p className="field__hint">{t("facilities.fieldFunctionTrmHint")}</p>
          ) : null}
        </div>

        <div className="field field--span-12">
          <label className="field__label" htmlFor={`${idPrefix}-code`}>
            {t("facilities.fieldCode")} <span className="field__req">*</span>
          </label>
          <input
            id={`${idPrefix}-code`}
            className="field__input entity-code-fields__code"
            value={value.code}
            onChange={(e) => {
              onCodeTouched();
              onChange({
                code: e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, FACILITY_CODE_LENGTH),
              });
            }}
            maxLength={FACILITY_CODE_LENGTH}
            pattern="[A-Z]{2}[A-Z0-9]{3}[A-Z0-9]{3}"
            placeholder="ESVALWHS"
            required
          />
          <p className="field__hint">{t("facilities.fieldCodeHint")}</p>
          {parsedCode ? (
            <div className="entity-code-fields__segments" aria-label={t("facilities.fieldCodeSegments")}>
              <span className="entity-code-fields__segment" title={t("facilities.fieldCodeSegmentCountry")}>
                {parsedCode.country}
              </span>
              <span className="entity-code-fields__segment-sep">+</span>
              <span className="entity-code-fields__segment" title={t("facilities.fieldCodeSegmentLocation")}>
                {parsedCode.locationKey}
              </span>
              <span className="entity-code-fields__segment-sep">+</span>
              <span
                className={`entity-code-fields__segment${
                  parsedCode.functionCode === FACILITY_PORT_FUNCTION
                    ? " entity-code-fields__segment--trm"
                    : ""
                }`}
                title={t("facilities.fieldCodeSegmentFunction")}
              >
                {parsedCode.functionCode}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
