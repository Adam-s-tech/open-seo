import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CrawlerAccessForm,
  crawlerCredentialsQueryKey,
} from "@/client/features/crawler-access/CrawlerAccessForm";
import {
  deleteCrawlerCredential,
  listCrawlerCredentials,
} from "@/serverFunctions/crawlerAccess";
import { isCrawlerAccessExpired } from "@/shared/crawler-access";

const formatDate = (value: string) => new Date(value).toLocaleDateString();

/**
 * Shopify crawler-access signatures saved on this project. The audit crawler
 * replays them per host, and other projects in the organization that audit
 * the same host pick them up too.
 */
export function CrawlerAccessSettings({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const credentialsQuery = useQuery({
    queryKey: crawlerCredentialsQueryKey,
    queryFn: () => listCrawlerCredentials(),
    select: (rows) => rows.filter((row) => row.projectId === projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCrawlerCredential({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: crawlerCredentialsQueryKey,
      });
      toast.success("Crawler access removed");
    },
  });

  const credentials = credentialsQuery.data ?? [];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-base-content/50">
        Crawler access
      </h2>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">Let the audit crawler through Shopify</p>
          <p className="mt-1 text-sm text-base-content/60">
            Paste the signature you created in Shopify admin under Online Store
            &rarr; Preferences &rarr; Crawler access. Every audit of that domain
            in your organization sends it with each request.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setIsAdding((value) => !value)}
        >
          {isAdding ? "Cancel" : "Add signature"}
        </button>
      </div>

      {isAdding && (
        <div className="rounded-lg border border-base-300 p-4">
          <CrawlerAccessForm
            projectId={projectId}
            initialHost=""
            onSaved={() => setIsAdding(false)}
          />
        </div>
      )}

      {credentialsQuery.isError ? (
        <p className="text-sm text-error">
          We couldn't load your crawler access.
        </p>
      ) : credentials.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Type</th>
                <th>Added</th>
                <th>Expires</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((credential) => (
                <tr key={credential.id} className="hover">
                  <td className="font-mono">{credential.host}</td>
                  <td className="text-base-content/70">Shopify signature</td>
                  <td className="text-base-content/70">
                    {formatDate(credential.createdAt)}
                  </td>
                  <td className="text-base-content/70">
                    {credential.expiresAt
                      ? formatDate(credential.expiresAt)
                      : "Unknown"}
                    {isCrawlerAccessExpired(credential.expiresAt) && (
                      <span className="ml-2 text-error">Expired</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      aria-label={`Remove crawler access for ${credential.host}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(credential.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
