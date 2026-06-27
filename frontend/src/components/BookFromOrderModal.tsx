import { ReactNode } from "react";
import { Modal } from "./Modal";

type BookFromOrderModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
};

export function BookFromOrderModal({ open, onClose, title, closeLabel, children }: BookFromOrderModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} closeLabel={closeLabel} className="app-modal--wide">
      {children}
    </Modal>
  );
}
