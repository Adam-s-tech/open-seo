import { Link } from "@tanstack/react-router";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Brain } from "lucide-react";
import { QueryError } from "@/client/components/QueryState";
import { Spinner } from "@/client/components/Spinner";
import { useSamAccess } from "./useSamAccess";
import { useSamSessions } from "./useSamSessions";
import { optInToSamBeta, useSamBetaOptIn } from "./samBetaOptIn";
import { SamBetaGate } from "./SamBetaGate";
import { SamSetupGate } from "./SamSetupGate";
import { SamConversation } from "./SamConversation";

/**
 * The SAM route's content: the active conversation, full-width. The chat
 * history list lives in the app sidebar's Chat tab (SamSidebarPanel); this
 * component gates on the beta opt-in, then lands the user in the most recent
 * session, creating one when the project has none.
 */
export function SamChat({
  projectId,
  activeSessionId,
}: {
  projectId: string;
  activeSessionId: string | undefined;
}) {
  const optedIn = useSamBetaOptIn();
  const access = useSamAccess(projectId);

  // The ref (not isPending) guards the auto-create below: React can re-run the
  // effect before the mutation state updates, and it resets on settle so
  // archiving the last chat starts a fresh one.
  const creating = useRef(false);
  // Kept in state: the mutation's own callbacks fire for the create started
  // from the effect below, but the hook's `isError` can miss it and leave the
  // spinner up.
  const [createError, setCreateError] = useState<Error | null>(null);
  const { sessionsQuery, sessions, goToSession, createSession } =
    useSamSessions(projectId, {
      replace: true,
      onCreateError: setCreateError,
      onCreateSettled: () => {
        creating.current = false;
      },
    });
  const { mutate: createSessionMutate } = createSession;
  const startChat = useCallback(() => {
    creating.current = true;
    setCreateError(null);
    createSessionMutate();
  }, [createSessionMutate]);

  // Landing without a session: open the most recent one, or start a fresh
  // chat when the project has none.
  const firstSessionId = sessions[0]?.id;
  useEffect(() => {
    if (activeSessionId || !optedIn || access.status !== "ready") return;
    if (firstSessionId) {
      goToSession(firstSessionId);
      return;
    }
    if (!sessionsQuery.isSuccess || creating.current) return;
    startChat();
  }, [
    activeSessionId,
    optedIn,
    access.status,
    firstSessionId,
    sessionsQuery.isSuccess,
    goToSession,
    startChat,
  ]);

  // The list holds every chat the user can open, so an id missing from it is
  // archived, deleted, or not theirs. The cached list can predate the link,
  // though (a chat started in another tab), so refetch once before saying so.
  const activeSession = sessions.find(
    (session) => session.id === activeSessionId,
  );
  // Gated on the cached list, not on isSuccess: a failed refetch keeps the
  // old list but leaves the query in error.
  const isMissing =
    activeSessionId !== undefined &&
    !activeSession &&
    sessionsQuery.data !== undefined;
  const [recheckedSessionId, setRecheckedSessionId] = useState<string>();
  const { refetch: refetchSessions } = sessionsQuery;
  useEffect(() => {
    if (!isMissing || recheckedSessionId === activeSessionId) return;
    void refetchSessions().finally(() =>
      setRecheckedSessionId(activeSessionId),
    );
  }, [isMissing, recheckedSessionId, activeSessionId, refetchSessions]);

  if (!optedIn) {
    return <SamBetaGate onContinue={optInToSamBeta} />;
  }

  if (access.status === "checking") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner />
      </div>
    );
  }

  if (access.status === "error") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <QueryError
          error={access.error}
          fallback="Could not load AI agent setup status."
          onRetry={access.onRetry}
          isRetrying={access.isRetrying}
        />
      </div>
    );
  }

  // SAM cannot answer a turn without OPENROUTER_API_KEY, so surface setup
  // instructions instead of letting a chat fail mid-stream (self-hosted only).
  if (access.status === "setup") {
    return (
      <div className="overflow-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto max-w-3xl">
          <SamSetupGate
            errorMessage={access.errorMessage}
            isRefetching={access.isRefetching}
            onRetry={access.onRetry}
          />
        </div>
      </div>
    );
  }

  if (!activeSessionId) {
    // Sessions are loading or a fresh chat is being created; the effect above
    // redirects into it. Either request can fail, and neither retries itself.
    const loadFailed = sessionsQuery.isError && !sessionsQuery.data;
    return (
      <div className="flex h-full items-center justify-center p-4">
        {loadFailed ? (
          <QueryError
            error={sessionsQuery.error}
            fallback="Failed to load your chats."
            onRetry={() => void sessionsQuery.refetch()}
            isRetrying={sessionsQuery.isFetching}
          />
        ) : createError ? (
          <QueryError
            error={createError}
            fallback="Failed to start a new chat."
            onRetry={startChat}
          />
        ) : (
          <Spinner />
        )}
      </div>
    );
  }

  // Never open a chat the list has not confirmed. Wait for the list and the
  // one refetch, show the list error if either fails, else say it is gone.
  if (!activeSession) {
    const confirmed =
      sessionsQuery.data !== undefined &&
      recheckedSessionId === activeSessionId;
    if (sessionsQuery.isFetching || (!confirmed && !sessionsQuery.isError)) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <Spinner />
        </div>
      );
    }
    if (sessionsQuery.isError) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <QueryError
            error={sessionsQuery.error}
            fallback="Failed to load your chats."
            onRetry={() => void refetchSessions()}
          />
        </div>
      );
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-base-content/70">
          This chat was archived or does not exist.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => goToSession()}
        >
          Go to your latest chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Session title + the shortest path to inspect or correct the shared
          memory SAM reads and writes during the conversation. */}
      <div className="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-3.5">
        <span className="truncate text-sm font-medium text-base-content/80">
          {activeSession.title}
        </span>
        <Link
          to="/p/$projectId/context"
          params={{ projectId }}
          className="flex shrink-0 items-center gap-1.5 text-xs text-base-content/60 transition-colors hover:text-base-content"
        >
          <Brain className="size-3.5" />
          Project memory
        </Link>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* useAgentChat suspends while it fetches the session's history; this
            boundary keeps that suspension inside the chat panel instead of
            letting it bubble up and swap out the whole shell — which read as
            a full page refresh on every session switch. */}
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <SamConversation
            key={activeSessionId}
            projectId={projectId}
            sessionId={activeSessionId}
          />
        </Suspense>
      </div>
    </div>
  );
}
