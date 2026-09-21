import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteAudit,
  getAuditHistory,
  startAudit,
} from "@/serverFunctions/audit";
import {
  DEFAULT_LAUNCH_FORM_VALUES,
  getMaxPagesLimit,
  MIN_PAGES,
  type LaunchFormValues,
} from "@/client/features/audit/launch/types";
import {
  createFormValidationErrors,
  shouldValidateFieldOnChange,
} from "@/client/lib/forms";
import { getStandardErrorMessage } from "@/client/lib/error-messages";

function getLaunchValidationErrors(
  value: LaunchFormValues,
  shouldValidateUntouchedField: boolean,
) {
  if (value.url.trim()) {
    return null;
  }

  if (!shouldValidateUntouchedField) {
    return null;
  }

  return createFormValidationErrors({
    fields: {
      url: "Please enter a URL.",
    },
  });
}

export function useLaunchController({
  projectId,
  isFreePlan,
  onAuditStarted,
}: {
  projectId: string;
  isFreePlan: boolean;
  onAuditStarted: (auditId: string) => void;
}) {
  const maxPagesLimit = getMaxPagesLimit(isFreePlan);
  const historyQuery = useQuery({
    queryKey: ["audit-history", projectId],
    queryFn: () => getAuditHistory({ data: { projectId } }),
    // Keep in-progress rows live so status and page counts don't need a reload.
    refetchInterval: (query) =>
      query.state.data?.some((audit) => audit.status === "running")
        ? 5000
        : false,
  });
  const { startMutation, deleteMutation } = useLaunchMutations({ projectId });

  const launchForm = useForm({
    defaultValues: DEFAULT_LAUNCH_FORM_VALUES,
    validators: {
      onChange: ({ formApi, value }) =>
        getLaunchValidationErrors(
          value,
          shouldValidateFieldOnChange(formApi, "url"),
        ),
      onSubmit: ({ value }) => getLaunchValidationErrors(value, true),
    },
    onSubmit: async ({ formApi, value }) => {
      const effectiveMaxPages = commitMaxPagesInput(launchForm, maxPagesLimit);
      formApi.setErrorMap({ onSubmit: undefined });

      if (effectiveMaxPages > 500) {
        const confirmed = window.confirm(
          `You are about to crawl ${effectiveMaxPages.toLocaleString()} pages. This is okay, but it may take a while. Continue?`,
        );
        if (!confirmed) {
          return;
        }
      }

      try {
        const result = await startMutation.mutateAsync({
          projectId,
          startUrl: value.url,
          maxPages: effectiveMaxPages,
          lighthouseStrategy: value.runLighthouse ? "auto" : "none",
        });
        toast.success("Audit started!");
        onAuditStarted(result.auditId);
      } catch (error) {
        formApi.setErrorMap({
          onSubmit: createFormValidationErrors({
            form: getStandardErrorMessage(error, "Failed to start audit"),
          }),
        });
      }
    },
  });

  return {
    launchForm,
    historyQuery,
    maxPagesLimit,
    commitMaxPagesInput: () => commitMaxPagesInput(launchForm, maxPagesLimit),
    deleteAudit: (auditId: string) => deleteMutation.mutate(auditId),
  };
}

function useLaunchMutations({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  // Invalidate rather than refetch: starting an audit navigates away from the
  // list, so the stale mark is what makes it reload when the user comes back.
  const invalidateHistory = () =>
    queryClient.invalidateQueries({ queryKey: ["audit-history", projectId] });

  const startMutation = useMutation({
    mutationFn: (data: {
      projectId: string;
      startUrl: string;
      maxPages: number;
      lighthouseStrategy: "auto" | "none";
    }) => startAudit({ data }),
    onSuccess: () => {
      void invalidateHistory();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (auditId: string) =>
      deleteAudit({ data: { projectId, auditId } }),
    onSuccess: () => {
      void invalidateHistory();
      toast.success("Audit deleted");
    },
  });

  return { startMutation, deleteMutation };
}

function commitMaxPagesInput(
  launchForm: {
    state: { values: { maxPagesInput: string } };
    setFieldValue: (field: "maxPagesInput", value: string) => void;
  },
  maxPagesLimit: number,
) {
  const maxPagesInput = launchForm.state.values.maxPagesInput;
  const value = maxPagesInput ? Number.parseInt(maxPagesInput, 10) : MIN_PAGES;
  const safeValue = Number.isFinite(value)
    ? Math.max(MIN_PAGES, Math.min(maxPagesLimit, Math.round(value)))
    : MIN_PAGES;
  launchForm.setFieldValue("maxPagesInput", String(safeValue));
  return safeValue;
}
