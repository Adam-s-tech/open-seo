import { useId, type ReactNode } from "react";
import { Modal } from "@/client/components/Modal";

/** A small settings-style dialog: title, labelled rows, right-aligned actions. */
export function FormDialog({
  title,
  onClose,
  actions,
  children,
}: {
  title: string;
  onClose?: () => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Modal maxWidth="max-w-md" onClose={onClose} labelledBy={titleId}>
      <h3 id={titleId} className="text-lg font-semibold">
        {title}
      </h3>
      {children}
      <div className="flex justify-end gap-2 pt-2">{actions}</div>
    </Modal>
  );
}
