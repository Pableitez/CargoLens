import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  findIsoCountry,
  formatIsoCountryLabel,
  resolveIsoCountryCodeFromQuery,
  searchIsoCountries,
} from "@shared/domain/isoCountries.js";
import { useDismissiblePopover } from "../hooks/useDismissiblePopover";
import { useAppTranslation } from "../i18n/useAppTranslation";

type CountryComboboxProps = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export function CountryCombobox({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  required,
}: CountryComboboxProps) {
  const { t, locale } = useAppTranslation();
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = findIsoCountry(value);
  const results = useMemo(
    () => searchIsoCountries(open ? query : value, locale),
    [open, query, value, locale]
  );

  useDismissiblePopover(anchorRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function openPanel() {
    if (disabled) return;
    setOpen(true);
    setQuery(selected ? formatIsoCountryLabel(value, locale) : value);
  }

  function pick(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  function handleBlur() {
    if (!open) return;
    const resolved = resolveIsoCountryCodeFromQuery(query);
    if (resolved) onChange(resolved);
    setOpen(false);
  }

  const inputValue = open ? query : selected ? formatIsoCountryLabel(value, locale) : value;
  const showList = open && !disabled;
  const noMatches = showList && query.trim().length > 0 && results.length === 0;

  return (
    <div
      ref={anchorRef}
      className={`location-combobox${open ? " location-combobox--open" : ""}${disabled ? " location-combobox--disabled" : ""}`}
    >
      <div className="location-combobox__control">
        <input
          id={id}
          type="search"
          className="field__input location-combobox__input"
          value={inputValue}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={openPanel}
          onClick={openPanel}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder ?? t("components.countryCombobox.placeholder")}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          required={required}
        />
        <button
          type="button"
          className="location-combobox__toggle"
          onClick={() => (open ? setOpen(false) : openPanel())}
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={t("components.countryCombobox.toggleOptions")}
          tabIndex={-1}
        >
          ▾
        </button>
      </div>

      {showList ? (
        <ul id={listId} className="location-combobox__list" role="listbox">
          {results.map((row) => {
            const nameKey = locale.startsWith("es") ? "nameEs" : "nameEn";
            return (
              <li key={row.code} role="option" aria-selected={row.code === value}>
                <button
                  type="button"
                  className="location-combobox__option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(row.code)}
                >
                  <span className="location-combobox__option-name">{row[nameKey]}</span>
                  <span className="location-combobox__option-meta">
                    <span className="location-combobox__option-code">{row.code}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {noMatches ? (
        <p className="location-combobox__empty" role="status">
          {t("components.countryCombobox.noMatch")}
        </p>
      ) : null}
    </div>
  );
}
