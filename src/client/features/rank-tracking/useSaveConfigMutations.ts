import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  createRankTrackingConfig,
  updateRankTrackingConfig,
} from "@/serverFunctions/rank-tracking";
import { captureClientEvent } from "@/client/lib/posthog";
import type {
  RankCheckScheduleTime,
  RankTrackingConfig,
} from "@/types/schemas/rank-tracking";

type ConfigFields = {
  devices: "both" | "desktop" | "mobile";
  serpDepth: number;
  locationCode: number;
  languageCode: string;
  targetingMode: "national" | "local";
  locationName: string | undefined;
  schedule: RankTrackingConfig["scheduleInterval"];
  scheduleTime: RankCheckScheduleTime | undefined;
};

export function useSaveConfigMutations(input: {
  projectId: string;
  existingConfig?: RankTrackingConfig | null;
  fields: ConfigFields;
  onCreated: (configId: string) => void;
  onUpdated: () => void;
}) {
  const { projectId, existingConfig, fields, onCreated, onUpdated } = input;
  const common = {
    devices: fields.devices,
    serpDepth: fields.serpDepth,
    locationCode: fields.locationCode,
    languageCode: fields.languageCode,
    scheduleInterval: fields.schedule,
    scheduleTime: fields.scheduleTime,
  };

  const createMutation = useMutation({
    mutationFn: (normalizedDomain: string) =>
      createRankTrackingConfig({
        data: {
          projectId,
          domain: normalizedDomain,
          ...common,
          locationName:
            fields.targetingMode === "local" ? fields.locationName : undefined,
        },
      }),
    onSuccess: (result) => {
      captureClientEvent("rank_tracking:config_create");
      toast.success("Domain added for rank tracking");
      onCreated(result.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (normalizedDomain: string) =>
      updateRankTrackingConfig({
        data: {
          projectId,
          configId: existingConfig!.id,
          domain: normalizedDomain,
          ...common,
          // null clears a previously-set local target; undefined would leave
          // the old location_name in the DB and silently keep city targeting.
          locationName:
            fields.targetingMode === "local" ? fields.locationName : null,
        },
      }),
    onSuccess: () => {
      captureClientEvent("rank_tracking:config_update");
      toast.success("Configuration updated");
      onUpdated();
    },
  });

  return { createMutation, updateMutation };
}
