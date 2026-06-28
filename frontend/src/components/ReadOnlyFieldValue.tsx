import type { ReactNode } from "react";

type ReadOnlyFieldValueProps = {
  id?: string;
  children: ReactNode;
};

export function ReadOnlyFieldValue({ id, children }: ReadOnlyFieldValueProps) {
  const text = children == null || (typeof children === "string" && !children.trim()) ? "—" : children;

  return (
    <p id={id} className="field__readonly-value">
      {text}
    </p>
  );
}
