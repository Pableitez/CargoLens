import {
  BE_CODE_CUSTOM_FUNCTION,
  BE_CODE_LENGTH,
  BE_CODE_SUGGESTED_FUNCTION_CODES,
  normalizeBeFunctionCode,
  parseBeCode,
} from "@shared/domain/beCode.js";
import { useAppTranslation } from "../i18n/useAppTranslation";
import { CountryCombobox } from "./CountryCombobox";

export type PartyBeCodeFormSlice = {
  legalName: string;
  country: string;
  functionCode: string;
  code: string;
};

type PartyBeCodeFieldsProps = {
  idPrefix: string;
  value: PartyBeCodeFormSlice;
  onChange: (patch: Partial<PartyBeCodeFormSlice>) => void;
  onCodeTouched: () => void;
  onSuggestReset: () => void;
  nameRequired?: boolean;
  nameLabelKey?: string;
  layout?: "stacked" | "inline";
};

export function PartyBeCodeFields({
  idPrefix,
  value,
  onChange,
  onCodeTouched,
  onSuggestReset,
  nameRequired = true,
  nameLabelKey = "partyField.party",
  layout = "inline",
}: PartyBeCodeFieldsProps) {
  const { t } = useAppTranslation();
  const suggestedFunction = BE_CODE_SUGGESTED_FUNCTION_CODES.includes(value.functionCode)
    ? value.functionCode
    : BE_CODE_CUSTOM_FUNCTION;
  const showCustomFunction = suggestedFunction === BE_CODE_CUSTOM_FUNCTION;
  const parsedCode = value.code.length === BE_CODE_LENGTH ? parseBeCode(value.code) : null;

  const nameSpan = layout === "inline" ? "field--span-8" : "field--span-12";
  const codeSpan = layout === "inline" ? "field--span-4" : "field--span-6";
  const countrySpan = layout === "inline" ? "field--span-4" : "field--span-6";
  const functionSpan = layout === "inline" ? "field--span-4" : "field--span-6";

  return (
    <>
      <div className={`field ${nameSpan}`}>
        <label className="field__label" htmlFor={`${idPrefix}-name`}>
          {t(nameLabelKey)} {nameRequired ? <span className="field__req">*</span> : null}
        </label>
        <input
          id={`${idPrefix}-name`}
          className="field__input"
          value={value.legalName}
          onChange={(e) => {
            onSuggestReset();
            onChange({ legalName: e.target.value });
          }}
          required={nameRequired}
        />
      </div>

      <div className={`field ${countrySpan}`}>
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

      <div className={`field ${functionSpan}`}>
        <label className="field__label" htmlFor={`${idPrefix}-function`}>
          {t("partyField.beCodeFunctionLabel")}
        </label>
        <select
          id={`${idPrefix}-function`}
          className="field__input"
          value={suggestedFunction}
          onChange={(e) => {
            onSuggestReset();
            const next = e.target.value;
            if (next === BE_CODE_CUSTOM_FUNCTION) {
              onChange({ functionCode: "" });
              return;
            }
            onChange({ functionCode: next });
          }}
        >
          {BE_CODE_SUGGESTED_FUNCTION_CODES.map((fn) => (
            <option key={fn} value={fn}>
              {t(`partyField.beCodeFunction.${fn}`)}
            </option>
          ))}
          <option value={BE_CODE_CUSTOM_FUNCTION}>{t("partyField.beCodeFunctionCustom")}</option>
        </select>
        {showCustomFunction ? (
          <input
            id={`${idPrefix}-function-custom`}
            className="field__input field__input--compact-top"
            value={value.functionCode}
            onChange={(e) => {
              onSuggestReset();
              onChange({ functionCode: normalizeBeFunctionCode(e.target.value) });
            }}
            placeholder={t("partyField.beCodeFunctionCustomPlaceholder")}
            maxLength={2}
            required
          />
        ) : null}
      </div>

      <div className={`field ${codeSpan}`}>
        <label className="field__label" htmlFor={`${idPrefix}-code`}>
          {t("partyField.beCode")} <span className="field__req">*</span>
        </label>
        <input
          id={`${idPrefix}-code`}
          className="field__input"
          value={value.code}
          onChange={(e) => {
            onCodeTouched();
            onChange({
              code: e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, BE_CODE_LENGTH),
            });
          }}
          maxLength={BE_CODE_LENGTH}
          pattern="[A-Z]{2}[A-Z0-9]{5}[A-Z0-9]{2}"
          required
        />
        <p className="field__hint">{t("partyField.beCodeHint")}</p>
        {parsedCode ? (
          <div className="entity-code-fields__segments" aria-label={t("partyField.beCodeSegments")}>
            <span className="entity-code-fields__segment" title={t("partyField.beCodeSegmentCountry")}>
              {parsedCode.country}
            </span>
            <span className="entity-code-fields__segment-sep">+</span>
            <span className="entity-code-fields__segment" title={t("partyField.beCodeSegmentName")}>
              {parsedCode.nameKey}
            </span>
            <span className="entity-code-fields__segment-sep">+</span>
            <span className="entity-code-fields__segment" title={t("partyField.beCodeSegmentFunction")}>
              {parsedCode.functionCode}
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}
