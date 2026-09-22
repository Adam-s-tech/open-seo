import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { saveCrawlerCredential } from "@/serverFunctions/crawlerAccess";
import {
  isCrawlerAccessExpired,
  parseSignatureExpiry,
} from "@/shared/crawler-access";

export const crawlerCredentialsQueryKey = ["crawler-credentials"];
export const saveCrawlerCredentialMutationKey = ["save-crawler-credential"];

/**
 * The two values a merchant copies out of Shopify admin. `Signature-Agent` is
 * a constant we add ourselves, so it is not asked for here.
 */
export function CrawlerAccessForm({
  projectId,
  initialHost,
  lockHost = false,
  onSaved,
}: {
  /** The project (website) the signature is stored on. */
  projectId: string;
  initialHost: string;
  lockHost?: boolean;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [host, setHost] = useState(initialHost);
  const [signatureInput, setSignatureInput] = useState("");
  const [signature, setSignature] = useState("");

  const saveMutation = useMutation({
    mutationKey: saveCrawlerCredentialMutationKey,
    mutationFn: () =>
      saveCrawlerCredential({
        data: { projectId, host, signatureInput, signature },
      }),
    onSuccess: async (saved) => {
      setSignatureInput("");
      setSignature("");
      await queryClient.invalidateQueries({
        queryKey: crawlerCredentialsQueryKey,
      });
      toast.success(`Crawler access saved for ${saved.host}`);
      onSaved?.();
    },
    onError: (error) =>
      toast.error(getStandardErrorMessage(error, "We couldn't save that")),
  });

  const isExpired = isCrawlerAccessExpired(
    parseSignatureExpiry(signatureInput),
  );
  const canSave =
    !isExpired &&
    projectId !== "" &&
    host.trim() !== "" &&
    signatureInput.trim() !== "" &&
    signature.trim() !== "";

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) saveMutation.mutate();
      }}
    >
      {!lockHost && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Domain</span>
          <input
            type="text"
            className="input input-bordered input-sm w-full font-mono"
            placeholder="store.example.com"
            value={host}
            onChange={(event) => setHost(event.target.value)}
          />
        </label>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Signature-Input</span>
        <input
          type="password"
          autoComplete="off"
          data-ph-mask
          className="input input-bordered input-sm w-full font-mono"
          placeholder="sig1=(...);expires=..."
          value={signatureInput}
          onChange={(event) => setSignatureInput(event.target.value)}
        />
        {isExpired && (
          <span className="block text-sm text-error">
            This signature has already expired. Create a new one in Shopify
            admin.
          </span>
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Signature</span>
        <input
          type="password"
          autoComplete="off"
          data-ph-mask
          className="input input-bordered input-sm w-full font-mono"
          placeholder="sig1=:...:"
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary btn-sm"
        disabled={!canSave || saveMutation.isPending}
      >
        {saveMutation.isPending ? "Saving…" : "Save signature"}
      </button>
    </form>
  );
}
