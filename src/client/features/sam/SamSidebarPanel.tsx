import { useLocation } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Loader2, Plus } from "lucide-react";
import { archiveSamSession } from "@/serverFunctions/sam";
import {
  invalidateSamSessions,
  samSessionsQueryOptions,
} from "@/client/features/sam/samQueries";
import { useSamBetaOptIn } from "./samBetaOptIn";
import { useSamSessions } from "./useSamSessions";

// Compact age label for the session list (PostHog-style "3h" / "12d").
// Timestamps come back as UTC from both backends: D1 as "YYYY-MM-DD HH:MM:SS"
// (no zone marker), Postgres as ISO-8601 with a trailing Z.
function ageLabel(timestamp: string): string {
  const iso = timestamp.includes("T") ? timestamp : `${timestamp}Z`;
  const then = new Date(iso.replace(" ", "T")).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * The sidebar's Chat tab: the active project's chat history plus a new-chat
 * button. Selecting (or creating) a session navigates to the SAM route; the
 * conversation itself renders in the main content panel.
 */
export function SamSidebarPanel({
  projectId,
  onNavigate,
}: {
  projectId: string;
  onNavigate?: () => void;
}) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const activeSessionId = (location.search as { s?: string }).s;
  const optedIn = useSamBetaOptIn();
  const { sessionsQuery, sessions, goToSession, createSession } =
    useSamSessions(projectId, { onNavigate });

  const archiveSession = useMutation({
    mutationFn: (sessionId: string) =>
      archiveSamSession({ data: { sessionId } }),
    onSuccess: (_result, sessionId) => {
      // Drop the chat from the cached list before leaving it, so the chat
      // route cannot pick it again as the most recent chat.
      queryClient.setQueryData(
        samSessionsQueryOptions(projectId).queryKey,
        (current) => current?.filter((session) => session.id !== sessionId),
      );
      void invalidateSamSessions(projectId);
      if (sessionId === activeSessionId) goToSession();
    },
  });

  // Until the user opts in, the chat route shows SamBetaGate; the tab just
  // points there instead of offering a chat list that can't be used yet.
  if (!optedIn) {
    return (
      <p className="px-4 py-6 text-center text-xs text-base-content/50">
        Sam is in beta and opt-in. Open Chat to read more and decide.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-2 pb-1">
        {/* Ghost row styled like a list item so the sidebar header doesn't
            stack three heavy full-width controls. */}
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-block justify-start gap-2 font-normal text-base-content/70 hover:text-base-content"
          disabled={createSession.isPending}
          onClick={() => createSession.mutate()}
        >
          {createSession.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
        {sessionsQuery.isLoading ? (
          <div className="flex justify-center py-6 text-base-content/50">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-base-content/50">
            No chats yet. Start a new one.
          </p>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-center gap-1 rounded-md px-1 ${
                  isActive ? "bg-base-300/50" : "hover:bg-base-300/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => goToSession(session.id)}
                  className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-base-content/80"
                >
                  {session.title}
                </button>
                {/* The age and the Archive button share one grid cell, so the
                    button takes the place of the age when it shows. */}
                <div className="grid shrink-0 place-items-center *:col-start-1 *:row-start-1">
                  <span className="text-xs text-base-content/40 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0 pointer-coarse:opacity-0">
                    {ageLabel(session.updatedAt)}
                  </span>
                  <button
                    type="button"
                    aria-label="Archive chat"
                    className="btn btn-ghost btn-xs btn-square reveal-on-hover"
                    disabled={archiveSession.isPending}
                    onClick={() => archiveSession.mutate(session.id)}
                  >
                    <Archive className="size-3.5 text-base-content/50" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
