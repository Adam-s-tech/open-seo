import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";

/** Card with a header row and a divided body: dashboard and connection cards. */
export function CardShell({
  title,
  icon,
  stamp,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  stamp?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card size="lg">
      <CardHeader className="border-b">
        <CardTitle className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-card shadow-sm">
              {icon}
            </span>
          ) : null}
          <h2 className="leading-tight">{title}</h2>
        </CardTitle>
        {action ? (
          <CardAction className="self-center">{action}</CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {children}
        {stamp ? (
          <p className="mt-4 text-[11px] text-muted-foreground">{stamp}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
