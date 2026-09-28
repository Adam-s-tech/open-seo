import type { ReactNode } from "react";
import { FormDialog } from "@/client/components/FormDialog";

/** Asks before an action that cannot be undone, such as one that spends credits. */
export function ConfirmDialog({
  title,
  confirmLabel,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <FormDialog
      title={title}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-base-content/70">{children}</p>
    </FormDialog>
  );
}
