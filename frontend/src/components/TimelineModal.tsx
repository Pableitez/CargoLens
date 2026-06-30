import { FormEvent, ReactNode } from "react";
import { Modal } from "./Modal";

type TimelineModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  addEventLabel: string;
  addEventPlaceholder: string;
  addEventButton: string;
  addingEventButton: string;
  eventMessage: string;
  onEventMessageChange: (value: string) => void;
  onAddEvent: (event: FormEvent) => void;
  addingEvent: boolean;
  messageInputId: string;
  children: ReactNode;
  allowAddEvent?: boolean;
};

export function TimelineModal({
  open,
  onClose,
  title,
  closeLabel,
  addEventLabel,
  addEventPlaceholder,
  addEventButton,
  addingEventButton,
  eventMessage,
  onEventMessageChange,
  onAddEvent,
  addingEvent,
  messageInputId,
  children,
  allowAddEvent = true,
}: TimelineModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={closeLabel}
      className="app-modal--timeline"
    >
      {allowAddEvent ? (
        <form className="timeline-modal__add dash-form" onSubmit={onAddEvent}>
          <div className="field">
            <label className="field__label" htmlFor={messageInputId}>
              {addEventLabel}
            </label>
            <input
              id={messageInputId}
              className="field__input"
              value={eventMessage}
              onChange={(event) => onEventMessageChange(event.target.value)}
              placeholder={addEventPlaceholder}
            />
          </div>
          <div className="dash-form__actions dash-form__actions--start">
            <button
              type="submit"
              className="btn btn--secondary"
              disabled={addingEvent || !eventMessage.trim()}
            >
              {addingEvent ? addingEventButton : addEventButton}
            </button>
          </div>
        </form>
      ) : null}
      {children}
    </Modal>
  );
}
