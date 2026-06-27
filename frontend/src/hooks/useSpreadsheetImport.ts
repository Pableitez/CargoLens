import { ChangeEvent, useCallback, useState } from "react";
import { messageFromApiErrorOrKey } from "../i18n/apiMessage.js";
import type { TranslateFn } from "../i18n/useAppTranslation";
import * as backgroundJobsApi from "../api/backgroundJobs";
import type { WorkspaceJob, WorkspaceJobKind } from "../api/backgroundJobs";
import { useAppToast } from "./useAppToast";

export type SpreadsheetImportPreviewBase = {
  valid: number;
  invalid: number;
  rowsTotal: number;
  preview: unknown[];
  errors: string[];
};

export type SpreadsheetImportCounts = {
  created?: number;
  updated?: number;
  skipped?: number;
  linked?: number;
};

export type SpreadsheetImportErrorKeys = {
  templateFailed?: string;
  loadFailed: string;
  importFailed: string;
};

export type UseSpreadsheetImportOptions<
  TPreview extends SpreadsheetImportPreviewBase,
  TResult extends SpreadsheetImportCounts,
> = {
  t: TranslateFn;
  errorKeys: SpreadsheetImportErrorKeys;
  previewFile: (file: File) => Promise<TPreview>;
  importFile: (file: File) => Promise<TResult>;
  downloadTemplate?: () => Promise<void>;
  /** i18n key for the default result message ({ created, updated, skipped }). */
  resultKey?: string;
  formatResult?: (data: TResult, t: TranslateFn) => string;
  /** Clear the selected file when preview fails (trade masters upload zone). */
  resetFileOnPreviewError?: boolean;
  /** Expose the uploaded file name for custom upload UI. */
  trackFileName?: boolean;
  /** Called after a successful import (modal refresh, list reload, etc.). */
  onImportSuccess?: (data: TResult) => void;
  /** Queue import on server and return immediately (see notification bell for progress). */
  backgroundJobKind?: WorkspaceJobKind;
  onJobQueued?: (job: WorkspaceJob) => void;
};

export function useSpreadsheetImport<
  TPreview extends SpreadsheetImportPreviewBase,
  TResult extends SpreadsheetImportCounts,
>({
  t,
  errorKeys,
  previewFile,
  importFile,
  downloadTemplate,
  resultKey,
  formatResult,
  resetFileOnPreviewError = false,
  trackFileName = false,
  onImportSuccess,
  backgroundJobKind,
  onJobQueued,
}: UseSpreadsheetImportOptions<TPreview, TResult>) {
  const { showToast } = useAppToast();
  const [preview, setPreview] = useState<TPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importResult, setImportResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState("");

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setSelectedFileName("");
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    if (!downloadTemplate) return;
    setDownloadingTemplate(true);
    setError("");
    try {
      await downloadTemplate();
    } catch {
      setError(t(errorKeys.templateFailed ?? errorKeys.loadFailed));
    } finally {
      setDownloadingTemplate(false);
    }
  }, [downloadTemplate, errorKeys.loadFailed, errorKeys.templateFailed, t]);

  const handleFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      setBusy(true);
      setError("");
      setImportResult("");
      setSelectedFile(file);
      if (trackFileName) setSelectedFileName(file.name);

      try {
        const data = await previewFile(file);
        setPreview(data);
      } catch (err) {
        setPreview(null);
        if (resetFileOnPreviewError) clearFile();
        setError(messageFromApiErrorOrKey(err, t, errorKeys.loadFailed));
      } finally {
        setBusy(false);
      }
    },
    [clearFile, errorKeys.loadFailed, previewFile, resetFileOnPreviewError, t, trackFileName]
  );

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;
    setBusy(true);
    setError("");
    try {
      if (backgroundJobKind) {
        const job = await backgroundJobsApi.enqueueImportJob(backgroundJobKind, selectedFile);
        setImportResult(t("backgroundJobs.queuedHint"));
        setPreview(null);
        clearFile();
        showToast({ message: t("backgroundJobs.queuedToast"), variant: "info" });
        onJobQueued?.(job);
        return;
      }

      const data = await importFile(selectedFile);
      setImportResult(
        formatResult
          ? formatResult(data, t)
          : resultKey
            ? t(resultKey, {
                created: data.created ?? 0,
                updated: data.updated ?? 0,
                skipped: data.skipped ?? 0,
              })
            : ""
      );
      setPreview(null);
      clearFile();
      onImportSuccess?.(data);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, errorKeys.importFailed));
    } finally {
      setBusy(false);
    }
  }, [
    backgroundJobKind,
    clearFile,
    errorKeys.importFailed,
    formatResult,
    importFile,
    onImportSuccess,
    onJobQueued,
    resultKey,
    selectedFile,
    showToast,
    t,
  ]);

  return {
    preview,
    selectedFile,
    selectedFileName,
    importResult,
    busy,
    downloadingTemplate,
    error,
    handleFile,
    handleImport,
    handleDownloadTemplate,
    canDownloadTemplate: Boolean(downloadTemplate),
  };
}
