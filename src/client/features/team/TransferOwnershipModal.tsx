import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/client/components/Modal";
import { getErrorCode } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { transferOwnership } from "@/serverFunctions/organization";

// NOT_FOUND: the member left. FORBIDDEN: the caller is no longer the owner
// (another tab). CONFLICT: a row changed mid-transfer.
function isTeamChangedError(error: Error) {
  const code = getErrorCode(error);
  return code === "CONFLICT" || code === "NOT_FOUND" || code === "FORBIDDEN";
}

export function TransferOwnershipModal({
  member,
  onClose,
  onTransferred,
}: {
  member: { id: string; user: { name?: string | null; email: string } };
  onClose: () => void;
  onTransferred: () => void;
}) {
  const displayName = member.user.name || member.user.email;

  const transferMutation = useMutation({
    mutationFn: () => transferOwnership({ data: { memberId: member.id } }),
    onSuccess: () => {
      captureClientEvent("team:ownership_transfer");
      toast.success(`${displayName} is now the owner`);
      onTransferred();
      onClose();
    },
    onError: (error: Error) => {
      const teamChanged = isTeamChangedError(error);
      toast.error(
        teamChanged
          ? "Your team changed while this was open. Ownership didn't change."
          : "We couldn't transfer ownership. Ownership didn't change.",
      );
      // Refresh either way so the list and the caller's role are current.
      onTransferred();
      // The confirmation is stale once the team changed: close it so the
      // refreshed list shows who is still there. Other errors keep it open
      // for a retry.
      if (teamChanged) onClose();
    },
  });

  return (
    <Modal
      maxWidth="max-w-md"
      onClose={transferMutation.isPending ? undefined : onClose}
      labelledBy="transfer-ownership-title"
    >
      <div>
        <h3 id="transfer-ownership-title" className="text-lg font-bold">
          Transfer ownership?
        </h3>
        <p className="mt-2 text-sm text-base-content/70">
          <span className="font-medium text-base-content" data-ph-mask>
            {displayName}
          </span>{" "}
          becomes the owner of this organization and manages its billing. You
          become an Admin and keep full access to each project.
        </p>
        <p className="mt-2 text-sm text-base-content/70">
          Projects, data, and the subscription stay with the organization. Only
          the new owner can transfer ownership again.
        </p>
      </div>
      <div className="modal-action mt-0">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          disabled={transferMutation.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => transferMutation.mutate()}
          disabled={transferMutation.isPending}
        >
          {transferMutation.isPending ? "Transferring…" : "Transfer ownership"}
        </button>
      </div>
    </Modal>
  );
}
