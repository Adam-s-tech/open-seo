import { useState } from "react";
import { Info } from "lucide-react";
import type { RankTrackingConfig } from "@/types/schemas/rank-tracking";
import {
  WEEKDAYS,
  browserTimeZoneLabel,
  describeSchedule,
  type LocalScheduleTime,
} from "./scheduleTime";

type Props = {
  schedule: RankTrackingConfig["scheduleInterval"];
  onScheduleChange: (schedule: RankTrackingConfig["scheduleInterval"]) => void;
  scheduleTime: LocalScheduleTime;
  onScheduleTimeChange: (scheduleTime: LocalScheduleTime) => void;
};

export function ScheduleField({
  schedule,
  onScheduleChange,
  scheduleTime,
  onScheduleTimeChange,
}: Props) {
  const [showScheduleTime, setShowScheduleTime] = useState(false);

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">Schedule</span>
      </label>
      <select
        className="select select-bordered w-full"
        value={schedule}
        onChange={(e) => {
          const value = e.target.value;
          if (
            value === "daily" ||
            value === "weekly" ||
            value === "monthly" ||
            value === "manual"
          ) {
            onScheduleChange(value);
          }
        }}
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly (end of month)</option>
        <option value="manual">Manual only</option>
      </select>
      {schedule !== "manual" && (
        <div className="mt-1.5 text-xs text-base-content/60">
          {describeSchedule(schedule, scheduleTime)}
          {!showScheduleTime && (
            <>
              {" "}
              &middot;{" "}
              <button
                type="button"
                className="link"
                onClick={() => setShowScheduleTime(true)}
              >
                change
              </button>
            </>
          )}
        </div>
      )}
      {schedule !== "manual" && showScheduleTime && (
        <>
          <div className="mt-2 flex gap-2">
            {schedule === "weekly" && (
              <select
                className="select select-bordered select-sm"
                aria-label="Day of week"
                value={scheduleTime.weekday}
                onChange={(e) =>
                  onScheduleTimeChange({
                    ...scheduleTime,
                    weekday: Number(e.target.value),
                  })
                }
              >
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            )}
            <input
              type="time"
              className="input input-bordered input-sm"
              aria-label="Time of day"
              value={`${String(scheduleTime.hour).padStart(2, "0")}:${String(scheduleTime.minute).padStart(2, "0")}`}
              onChange={(e) => {
                const [hour, minute] = e.target.value.split(":").map(Number);
                // Clearing the field yields "", which has no time to keep.
                if (Number.isNaN(hour) || Number.isNaN(minute)) return;
                onScheduleTimeChange({ ...scheduleTime, hour, minute });
              }}
            />
          </div>
          <div className="mt-1.5 text-xs text-base-content/50">
            In your local timezone: {browserTimeZoneLabel()}
          </div>
        </>
      )}
      {schedule === "daily" && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-warning">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>Daily checks use 7x more credits than weekly</span>
        </div>
      )}
    </div>
  );
}
