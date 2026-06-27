import { useEffect, useState } from "react";

/** Split bulk paste lines by tab, semicolon, or comma. Skips blank lines and # comments. */
export function parseDelimitedLines(text: string, minCols = 1): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
      if (line.includes(";")) return line.split(";").map((cell) => cell.trim());
      return line.split(",").map((cell) => cell.trim());
    })
    .filter((cols) => cols.length >= minCols);
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
