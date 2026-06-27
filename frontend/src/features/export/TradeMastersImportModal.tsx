import type { TradeMastersImportKind } from "../../api/tradeMastersImport";
import { Modal } from "../../components/Modal";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { TradeMastersImportPanel } from "./TradeMastersImportPanel";

type TradeMastersImportModalProps = {
  open: boolean;
  kind: TradeMastersImportKind;
  onClose: () => void;
  onImportSuccess?: () => void;
};

export function TradeMastersImportModal({
  open,
  kind,
  onClose,
  onImportSuccess,
}: TradeMastersImportModalProps) {
  const { t } = useAppTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(`tradeMastersImport.kind.${kind}.title`)}
      closeLabel={t("toast.close")}
      className="app-modal--wide app-modal--tm-import"
    >
      {open ? (
        <TradeMastersImportPanel key={kind} kind={kind} embedded onImportSuccess={onImportSuccess} />
      ) : null}
    </Modal>
  );
}
