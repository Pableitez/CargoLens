import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useDismissiblePopover } from "../hooks/useDismissiblePopover";
import { useAppTranslation } from "../i18n/useAppTranslation";
import {
  findLocationByCode,
  formatLocationLabel,
  resolveLocationCode,
  searchLocations,
} from "../utils/locationUtils";

type LocationComboboxProps = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Inline expanding list — avoids clipping inside tables/modals. */
  listMode?: "dropdown" | "panel";
};

export function LocationCombobox({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  listMode = "dropdown",
}: LocationComboboxProps) {
  const { t } = useAppTranslation();
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = findLocationByCode(value);
  const results = useMemo(() => searchLocations(open ? query : value), [open, query, value]);

  useDismissiblePopover(anchorRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function openPanel() {
    if (disabled) return;
    setOpen(true);
    setQuery(selected ? `${selected.name} ${selected.code}` : value);
  }

  function pick(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  function handleBlur() {
    if (!open) return;
    const resolved = resolveLocationCode(query);
    if (resolved) onChange(resolved);
    setOpen(false);
  }

  const inputValue = open ? query : selected ? formatLocationLabel(selected.code, "") : value;
  const showList = open && !disabled;
  const noMatches = showList && query.trim().length > 0 && results.length === 0;

  const optionsList = (
    <ul id={listId} className="location-combobox__list" role="listbox">
      {results.map((location) => (
        <li key={location.code} role="option" aria-selected={location.code === value}>
          <button
            type="button"
            className="location-combobox__option"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(location.code)}
          >
            <span className="location-combobox__option-name">{location.name}</span>
            <span className="location-combobox__option-meta">
              <span className="location-combobox__option-code">{location.code}</span>
              <span className="location-combobox__option-country">{location.country}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={anchorRef}
      className={`location-combobox${open ? " location-combobox--open" : ""}${disabled ? " location-combobox--disabled" : ""}${listMode === "panel" ? " location-combobox--panel" : ""}`}
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
          placeholder={placeholder ?? t("components.locationCombobox.placeholder")}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        <button
          type="button"
          className="location-combobox__toggle"
          onClick={() => (open ? setOpen(false) : openPanel())}
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={t("components.locationCombobox.toggleOptions")}
          tabIndex={-1}
        >
          ▾
        </button>
      </div>

      {showList && listMode === "panel" ? (
        <div className="location-combobox__dropdown location-combobox__dropdown--panel">
          {optionsList}
          {noMatches ? (
            <p className="location-combobox__empty" role="status">
              {t("components.locationCombobox.noMatch")}
            </p>
          ) : null}
        </div>
      ) : null}

      {showList && listMode === "dropdown" ? optionsList : null}

      {noMatches && listMode === "dropdown" ? (
        <p className="location-combobox__empty" role="status">
          {t("components.locationCombobox.noMatch")}
        </p>
      ) : null}
    </div>
  );
}

type LocationCellProps = {
  code: string;
};

export function LocationCell({ code }: LocationCellProps) {
  const location = findLocationByCode(code);
  if (!location) {
    return <span>{code.trim() || "—"}</span>;
  }

  return (
    <span className="location-cell" title={`${location.name} · ${location.country}`}>
      <span className="location-cell__name">{location.name}</span>
      <span className="location-cell__code">{location.code}</span>
    </span>
  );
}
