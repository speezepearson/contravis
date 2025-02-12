export type GenericFormValue = Record<string, string | number>;

export function GenericForm<T extends GenericFormValue>({
  value,
  onChange,
}: {
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      {Object.entries(value).map(([key, subvalue]) => (
        <span key={key}>
          {key}{" "}
          {typeof subvalue === "string" ? (
            <input
              type="text"
              value={subvalue}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          ) : (
            <input
              type="number"
              value={subvalue}
              onChange={(e) =>
                onChange({ ...value, [key]: parseFloat(e.target.value) })
              }
            />
          )}
        </span>
      ))}
    </div>
  );
}
