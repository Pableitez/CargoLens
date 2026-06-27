import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useDismissiblePopover } from "../hooks/useDismissiblePopover";
import { useAppTranslation } from "../i18n/useAppTranslation";

export type EntitySearchOption = {
  id: string;
  label: string;
  meta?: string;
};

const MAX_RESULTS = 50;
const DEBOUNCE_MS = 200;
const MIN_QUERY = 1;

type BaseProps = {
  id: string;
  onSearch: (query: string, field?: string) => Promise<EntitySearchOption[]>;
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  minQueryLength?: number;
  hideTypeHint?: boolean;
  emptyMessage?: string;
  searchFields?: Array<{ id: string; label: string }>;
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
  valueLabel?: string;
};

type MultiProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type EntitySearchPickerProps = SingleProps | MultiProps;

export function EntitySearchPicker(props: EntitySearchPickerProps) {
  const {
    id,
    onSearch,
    excludeIds = [],
    placeholder,
    disabled = false,
    minQueryLength = MIN_QUERY,
    hideTypeHint = false,
    emptyMessage,
    multiple = false,
    searchFields,
  } = props;

  const { t } = useAppTranslation();
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState(() => searchFields?.[0]?.id ?? "");
  const [results, setResults] = useState<EntitySearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<Map<string, string>>(new Map());

  const singleProps = !multiple ? (props as SingleProps) : null;
  const multiProps = multiple ? (props as MultiProps) : null;

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);
  const valueLabel = singleProps?.valueLabel;
  const singleValue = singleProps?.value ?? "";
  const multiValue = multiProps?.value ?? [];
  const selectedIds: string[] = multiple ? multiValue : singleValue ? [singleValue] : [];
  const onSearchRef = useRef(onSearch);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useDismissiblePopover(anchorRef, () => setOpen(false), open);

  const runSearch = useCallback(
    async (term: string) => {
      if (minQueryLength > 0 && term.trim().length < minQueryLength) {
        setResults([]);
        setSearchError(false);
        setLoading(false);
        return;
      }
      const requestId = ++searchRequestRef.current;
      setLoading(true);
      setSearchError(false);
      try {
        const field = searchFields?.length ? searchField : undefined;
        const rows = await onSearchRef.current(term.trim(), field);
        if (requestId !== searchRequestRef.current) return;
        setResults(rows.filter((row) => !excludeSet.has(row.id)).slice(0, MAX_RESULTS));
      } catch {
        if (requestId !== searchRequestRef.current) return;
        setResults([]);
        setSearchError(true);
      } finally {
        if (requestId === searchRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [excludeSet, minQueryLength, searchField, searchFields]
  );

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, query, runSearch, searchField]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!multiple && singleValue && valueLabel) {
      setSelectedLabels((prev) => {
        if (prev.get(singleValue) === valueLabel) return prev;
        const next = new Map(prev);
        next.set(singleValue, valueLabel);
        return next;
      });
    }
  }, [multiple, singleValue, valueLabel]);

  function rememberLabel(option: EntitySearchOption) {
    setSelectedLabels((prev) => {
      const next = new Map(prev);
      next.set(option.id, option.label);
      return next;
    });
  }

  function pickSingle(option: EntitySearchOption) {
    if (!singleProps) return;
    rememberLabel(option);
    singleProps.onChange(option.id);
    setOpen(false);
    setQuery("");
  }

  function toggleMulti(option: EntitySearchOption) {
    if (!multiProps) return;
    rememberLabel(option);
    const set = new Set(multiProps.value);
    if (set.has(option.id)) set.delete(option.id);
    else set.add(option.id);
    multiProps.onChange([...set]);
  }

  function removeChip(optionId: string) {
    if (!multiProps) return;
    multiProps.onChange(multiProps.value.filter((id) => id !== optionId));
  }

  function openPanel() {
    if (disabled) return;
    setOpen(true);
  }

  const inputPlaceholder = placeholder ?? t("components.entitySearchPicker.placeholder");
  const closedLabel = !multiple ? (valueLabel ?? selectedLabels.get(singleValue) ?? "") : "";
  const inputValue = open ? query : closedLabel;
  const showDropdown = open && !disabled;
  const noMatchText = searchError
    ? t("components.entitySearchPicker.searchFailed")
    : (emptyMessage ?? t("components.entitySearchPicker.noMatch"));

  return (
    <div className="entity-search-picker">
      {searchFields?.length ? (
        <div className="entity-search-picker__field-row">
          <label className="entity-search-picker__field-label" htmlFor={`${id}-field`}>
            {t("components.entitySearchPicker.searchFieldLabel")}
          </label>
          <select
            id={`${id}-field`}
            className="field__input entity-search-picker__field-select"
            value={searchField}
            onChange={(event) => setSearchField(event.target.value)}
            disabled={disabled}
          >
            {searchFields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {multiple && selectedIds.length > 0 ? (
        <ul className="entity-search-picker__chips" aria-label={t("components.entitySearchPicker.selected")}>
          {selectedIds.map((optionId) => (
            <li key={optionId}>
              <span className="entity-search-picker__chip">
                {selectedLabels.get(optionId) ?? optionId}
                <button
                  type="button"
                  className="entity-search-picker__chip-remove"
                  onClick={() => removeChip(optionId)}
                  disabled={disabled}
                  aria-label={t("components.entitySearchPicker.removeChip")}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

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
            disabled={disabled}
            placeholder={inputPlaceholder}
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
            aria-label={t("components.entitySearchPicker.toggleOptions")}
            tabIndex={-1}
          >
            ▾
          </button>
        </div>

        {showDropdown ? (
          <div className="location-combobox__dropdown">
            {loading && results.length === 0 ? (
              <p className="location-combobox__empty" role="status">
                {t("components.entitySearchPicker.loading")}
              </p>
            ) : results.length > 0 ? (
              <ul
                id={listId}
                className="location-combobox__list location-combobox__list--panel"
                role="listbox"
              >
                {results.map((option) => {
                  const checked = selectedIds.includes(option.id);
                  return (
                    <li key={option.id} role="option" aria-selected={checked}>
                      <button
                        type="button"
                        className="location-combobox__option"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => (multiple ? toggleMulti(option) : pickSingle(option))}
                      >
                        {multiple ? (
                          <span className="entity-search-picker__check" aria-hidden="true">
                            {checked ? "☑" : "☐"}
                          </span>
                        ) : null}
                        <span className="location-combobox__option-name">{option.label}</span>
                        {option.meta ? (
                          <span className="location-combobox__option-meta">
                            <span className="location-combobox__option-code">{option.meta}</span>
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="location-combobox__empty" role="status">
                {noMatchText}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {!hideTypeHint ? (
        <p className="entity-search-picker__hint">{t("components.entitySearchPicker.typeHint")}</p>
      ) : null}
    </div>
  );
}
