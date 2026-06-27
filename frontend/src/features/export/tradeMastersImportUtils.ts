import {
  downloadKindExport,
  downloadKindTemplate,
  TradeMastersImportKind,
  TradeMastersKindImportResult,
} from "../../api/tradeMastersImport";
import { downloadBlob } from "../../utils/downloadBlob";
import type { TranslateFn } from "../../i18n/useAppTranslation";

const DEFAULT_FILENAMES: Record<TradeMastersImportKind, { template: string; export: string }> = {
  parties: { template: "parties-plantilla.xlsx", export: "parties-export.xlsx" },
  facilities: { template: "facilities-plantilla.xlsx", export: "facilities-export.xlsx" },
  related_parties: { template: "related-parties-plantilla.xlsx", export: "related-parties-export.xlsx" },
  related_facilities: {
    template: "related-facilities-plantilla.xlsx",
    export: "related-facilities-export.xlsx",
  },
};

export async function downloadTradeMastersKindTemplate(kind: TradeMastersImportKind) {
  const blob = await downloadKindTemplate(kind);
  downloadBlob(blob, DEFAULT_FILENAMES[kind].template);
}

export async function downloadTradeMastersKindExport(kind: TradeMastersImportKind) {
  const blob = await downloadKindExport(kind);
  downloadBlob(blob, DEFAULT_FILENAMES[kind].export);
}

export function tradeMastersImportPath(kind: TradeMastersImportKind) {
  return `/dashboard/clients/trade-masters/import/${kind.replace(/_/g, "-")}`;
}

export const TRADE_MASTERS_IMPORT_HUB = "/dashboard/clients/trade-masters/import";

export function formatTradeMastersImportResult(
  kind: TradeMastersImportKind,
  data: TradeMastersKindImportResult,
  t: TranslateFn
) {
  if (kind === "parties" || kind === "facilities") {
    return t(`tradeMastersImport.result.${kind}`, {
      created: data.created ?? 0,
      updated: data.updated ?? 0,
      skipped: data.skipped ?? 0,
    });
  }
  return t(`tradeMastersImport.result.${kind}`, {
    linked: data.linked ?? 0,
    updated: data.updated ?? 0,
    skipped: data.skipped ?? 0,
  });
}
