import type { ReactNode } from "react";
import { GoogleGlyph } from "@/client/features/gsc/GoogleGlyph";
import { Button } from "@/client/components/ui/button";

export function GoogleProjectEmptyState({
  name,
  hasGrant,
  disabled,
  canManage,
  prominent,
  onChoose,
  onLink,
  children,
}: {
  name: string;
  hasGrant: boolean;
  disabled: boolean;
  canManage: boolean;
  prominent?: boolean;
  onChoose: () => void;
  onLink: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {hasGrant
          ? `Choose a ${name} property to finish connecting this project.`
          : `Connect ${name} to see this project’s data.`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {canManage || hasGrant ? (
          <Button
            variant={prominent ? "default" : "outline"}
            size={prominent ? "lg" : "sm"}
            onClick={hasGrant ? onChoose : onLink}
            pending={disabled}
          >
            {disabled || hasGrant ? null : prominent ? (
              // The white chip keeps the brand colours readable on a primary
              // button.
              <span className="flex size-6 items-center justify-center rounded-full bg-white">
                <GoogleGlyph className="size-4" />
              </span>
            ) : (
              <GoogleGlyph className="size-[18px]" />
            )}
            {disabled
              ? "Opening Google…"
              : canManage
                ? hasGrant
                  ? "Choose property"
                  : "Connect"
                : "Manage Google accounts"}
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
