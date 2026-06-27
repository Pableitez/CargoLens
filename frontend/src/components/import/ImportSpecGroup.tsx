type ImportSpecGroupProps = {
  title: string;
  cols: string[];
  required: boolean;
  i18nPrefix: string;
  t: (key: string) => string;
};

export function ImportSpecGroup({ title, cols, required, i18nPrefix, t }: ImportSpecGroupProps) {
  return (
    <div className="import-spec-group">
      <h3 className="import-spec-group__title">{title}</h3>
      <div className="import-spec" role="table">
        <div className="import-spec__row import-spec__row--head">
          <span>{t(`${i18nPrefix}.colColumn`)}</span>
          <span>{t(`${i18nPrefix}.colRequired`)}</span>
          <span>{t(`${i18nPrefix}.colDesc`)}</span>
        </div>
        {cols.map((col) => (
          <div key={col} className={`import-spec__row${required ? " import-spec__row--required" : ""}`}>
            <span>
              <code>{col}</code>
            </span>
            <span>
              <span className={`import-spec__badge import-spec__badge--${required ? "yes" : "no"}`}>
                {required ? t(`${i18nPrefix}.colYes`) : t(`${i18nPrefix}.colNo`)}
              </span>
            </span>
            <span>{t(`${i18nPrefix}.col.${col}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
