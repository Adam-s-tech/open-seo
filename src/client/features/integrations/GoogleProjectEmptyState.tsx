import type { ReactNode } from "react";
import { GoogleGlyph } from "@/client/features/gsc/GoogleGlyph";
import { Button } from "@/client/components/ui/button";

export function GoogleProjectEmptyState({
  name,
  hasGrant,
  disabled,
  canManage,
  onChoose,
  onLink,
  children,
}: {
  name: string;
  hasGrant: boolean;
  disabled: boolean;
  canManage: boolean;
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
            variant="outline"
            size="sm"
            onClick={hasGrant ? onChoose : onLink}
            pending={disabled}
          >
            {!disabled && !hasGrant ? (
              <GoogleGlyph className="size-[18px]" />
            ) : null}
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
