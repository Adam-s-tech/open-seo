import { AgentList } from "./AgentList";
import { AgentSetupPanel, AGENT_SETUP_DESCRIPTION } from "./AgentSetupPanel";
import { getAgentSetupPrompt } from "./agentSetupPrompt";
import { captureClientEvent } from "@/client/lib/posthog";
import { WizardFooter } from "@/client/features/onboarding/WizardFooter";

export function AgentSetup({
  onComplete,
  onBack,
  disabled = false,
}: {
  onComplete: () => void;
  onBack: () => void;
  disabled?: boolean;
}) {
  const prompt = getAgentSetupPrompt(window.location.origin);

  return (
    <fieldset disabled={disabled}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set up your agent
        </h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          {AGENT_SETUP_DESCRIPTION}
        </p>
        <AgentList />
      </div>
      <AgentSetupPanel
        prompt={prompt}
        onCopy={() => captureClientEvent("onboarding:setup_prompt_copy")}
      />
      <div className="mt-7 border-t border-border pt-5">
        <WizardFooter
          onBack={onBack}
          onContinue={onComplete}
          continueLabel="Finish"
          continueDisabled={disabled}
        />
      </div>
    </fieldset>
  );
}
