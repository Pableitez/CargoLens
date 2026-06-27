type ModuleListSearchProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
};

export function ModuleListSearch({ id, value, onChange, label, placeholder }: ModuleListSearchProps) {
  return (
    <div className="module-list-search">
      <label className="module-list-search__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        className="field__input module-list-search__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
