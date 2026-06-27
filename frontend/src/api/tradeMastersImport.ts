import { api } from "./client.js";

export type TradeMastersImportKind = "parties" | "facilities" | "related_parties" | "related_facilities";

export const TRADE_MASTERS_IMPORT_KIND_SLUGS: Record<TradeMastersImportKind, string> = {
  parties: "parties",
  facilities: "facilities",
  related_parties: "related-parties",
  related_facilities: "related-facilities",
};

export type TradeMastersImportPreviewRow = {
  rowNumber: number;
  label: string;
  errors: string[];
  valid: boolean;
};

export type TradeMastersKindImportPreview = {
  ok: boolean;
  kind: TradeMastersImportKind;
  rowsTotal: number;
  valid: number;
  invalid: number;
  preview: TradeMastersImportPreviewRow[];
  errors: string[];
};

export type TradeMastersKindImportResult = {
  ok: boolean;
  kind: TradeMastersImportKind;
  created?: number;
  updated?: number;
  linked?: number;
  skipped: number;
  errors: string[];
};

function kindPath(kind: TradeMastersImportKind) {
  return TRADE_MASTERS_IMPORT_KIND_SLUGS[kind];
}

export async function previewTradeMastersKindImport(
  kind: TradeMastersImportKind,
  file: File
): Promise<TradeMastersKindImportPreview> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<TradeMastersKindImportPreview>(
    `/trade-masters/import/${kindPath(kind)}/preview`,
    body
  );
  return data;
}

export async function importTradeMastersKindFile(
  kind: TradeMastersImportKind,
  file: File
): Promise<TradeMastersKindImportResult> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<TradeMastersKindImportResult>(
    `/trade-masters/import/${kindPath(kind)}`,
    body
  );
  return data;
}

export async function downloadKindTemplate(kind: TradeMastersImportKind): Promise<Blob> {
  const { data } = await api.get<Blob>(`/trade-masters/import/${kindPath(kind)}/template`, {
    responseType: "blob",
  });
  return data;
}

export async function downloadKindExport(kind: TradeMastersImportKind): Promise<Blob> {
  const { data } = await api.get<Blob>(`/trade-masters/import/${kindPath(kind)}/export`, {
    responseType: "blob",
  });
  return data;
}
