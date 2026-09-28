import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryState } from "@/client/components/QueryState";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { RowActionsMenu } from "@/client/components/RowActionsMenu";
import { DropdownMenuItem } from "@/client/components/ui/dropdown-menu";
import { CopyButton } from "@/client/components/CopyButton";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient } from "@/lib/auth-client";

// Better Auth rejects longer names with INVALID_NAME_LENGTH.
const MAX_KEY_NAME_LENGTH = 32;

export function ApiKeySettings() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<{ id: string; name: string } | null>(
    null,
  );

  const mcpUrl =
    typeof window === "undefined"
      ? "https://app.openseo.so/mcp"
      : `${window.location.origin}/mcp`;

  const apiKeysQuery = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const result = await authClient.apiKey.list();
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to load API keys");
      }
      return result.data.apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        start: key.start,
        createdAt: new Date(key.createdAt),
        lastRequest: key.lastRequest ? new Date(key.lastRequest) : null,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (keyName: string) => {
      const result = await authClient.apiKey.create({ name: keyName });
      if (result.error || !result.data?.key) {
        throw new Error(result.error?.message ?? "Failed to create the key");
      }
      return result.data.key;
    },
    onSuccess: (key) => {
      setCreatedKey(key);
      setName("");
      captureClientEvent("mcp:api_key_created");
      void queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const result = await authClient.apiKey.delete({ keyId });
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to revoke the key");
      }
    },
    onSuccess: () => {
      captureClientEvent("mcp:api_key_revoked");
      toast.success("API key revoked");
      setRevoking(null);
      void queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreatedKey(null);
    setName("");
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-base-content/50">API keys</h2>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">
            Authenticate MCP clients when OAuth doesn't work
          </p>
          <p className="mt-1 text-sm text-base-content/60">
            Use this for remote agents like Hermes where the normal login flow
            doesn't work.
          </p>
          <p className="mt-1 text-sm">
            <a
              className="link link-primary"
              href="https://openseo.so/docs/mcp"
              target="_blank"
              rel="noreferrer"
            >
              Setup guide
            </a>
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsCreateOpen(true)}
        >
          Create API key
        </button>
      </div>

      <QueryState
        query={apiKeysQuery}
        errorFallback="We couldn't load your API keys."
      >
        {(apiKeys) =>
          apiKeys.length === 0 ? (
            <p className="text-sm text-base-content/60">No API keys yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key</th>
                    <th>Created</th>
                    <th>Last used</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover">
                      <td className="max-w-[220px] truncate font-medium">
                        {key.name || "Unnamed key"}
                      </td>
                      <td
                        className="font-mono text-xs text-base-content/70"
                        data-ph-mask
                      >
                        {key.start || "oseo_"}…
                      </td>
                      <td className="text-xs text-base-content/70">
                        {key.createdAt.toLocaleDateString()}
                      </td>
                      <td className="text-xs text-base-content/70">
                        {key.lastRequest
                          ? key.lastRequest.toLocaleDateString()
                          : "Never"}
                      </td>
                      <td>
                        <RowActionsMenu
                          label={`Actions for ${key.name || "API key"}`}
                        >
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setRevoking({
                                id: key.id,
                                name: key.name || "Unnamed key",
                              })
                            }
                          >
                            <Trash2 />
                            Revoke key
                          </DropdownMenuItem>
                        </RowActionsMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>

      {revoking ? (
        <ConfirmDialog
          title={`Revoke \u201c${revoking.name}\u201d?`}
          confirmLabel="Revoke key"
          destructive
          pending={revokeMutation.isPending}
          onClose={() => setRevoking(null)}
          onConfirm={() => revokeMutation.mutate(revoking.id)}
        >
          Clients using it will stop working.
        </ConfirmDialog>
      ) : null}

      <Dialog
        open={isCreateOpen}
        // The key is shown once, so only Done closes the reveal step. Escape
        // and an outside click close the name step.
        onOpenChange={(open) => {
          if (!open && createdKey == null) closeCreateModal();
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Copy your new API key</DialogTitle>
                <DialogDescription>
                  It won't be shown again. Send it as{" "}
                  <span className="font-mono text-xs">
                    Authorization: Bearer
                  </span>{" "}
                  to <span className="font-mono text-xs">{mcpUrl}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <code
                  className="min-w-0 flex-1 overflow-x-auto rounded bg-base-200 px-2.5 py-2 font-mono text-xs"
                  data-ph-mask
                >
                  {createdKey}
                </code>
                <CopyButton
                  value={createdKey}
                  successMessage="API key copied"
                  label="Copy API key"
                  variant="ghost"
                  size="icon-sm"
                />
              </div>
              <DialogFooter>
                <Button onClick={closeCreateModal}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim()) createMutation.mutate(name.trim());
              }}
            >
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
              </DialogHeader>
              <label className="form-control w-full">
                <span className="label-text pb-1 text-xs text-base-content/60">
                  Name
                </span>
                <input
                  className="input input-sm input-bordered w-full"
                  placeholder="Claude Code on laptop"
                  value={name}
                  maxLength={MAX_KEY_NAME_LENGTH}
                  onChange={(event) => setName(event.currentTarget.value)}
                  required
                  autoFocus
                />
              </label>
              <DialogFooter>
                <Button variant="ghost" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  pending={createMutation.isPending}
                  disabled={!name.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
