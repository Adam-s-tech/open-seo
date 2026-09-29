import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/client/components/ui/button";

export function WizardFooter({
  onBack,
  onSkip,
  skipLabel = "Skip",
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  continueAction,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueAction?: ReactNode;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
      ) : onSkip ? (
        <Button type="button" variant="ghost" onClick={onSkip}>
          {skipLabel}
        </Button>
      ) : null}
      <div className="flex items-center gap-2">
        {onBack && onSkip ? (
          <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
            {skipLabel}
          </Button>
        ) : null}
        {continueAction ?? (
          <Button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || !onContinue}
          >
            {continueLabel} <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
