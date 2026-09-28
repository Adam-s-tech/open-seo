import { eq } from "drizzle-orm";
import { db } from "@/db";
import { member, user } from "@/db/schema";
import { hasOrgPermission } from "@/lib/org-permissions";
import {
  getContactNameParts,
  sendLoopsEvent,
  updateLoopsContact,
} from "@/server/email/loops-client";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";
import type { BillingCustomerStatusSnapshot } from "./customer-status-model";
import type { BillingLifecycleEvent } from "./lifecycle-events";
import { getBillingLoopsContactProperties } from "./loops-contact-properties";

/** Refreshes every member's billing properties in Loops and sends lifecycle
 *  events to the members who can manage billing — the only people who can act
 *  on a failed payment, and the ones who cancelled.
 *
 *  Each event's idempotency key is the event, organization, recipient and the
 *  previous snapshot's timestamp, which is stable across webhook retries, so a
 *  retried send lands in Loops's 24-hour dedup window. */
export async function syncBillingStatusToLoops({
  snapshot,
  events,
  previousSyncedAt,
}: {
  snapshot: BillingCustomerStatusSnapshot;
  events: BillingLifecycleEvent[];
  previousSyncedAt: string | null;
}) {
  const apiKey = await getOptionalEnvValue("LOOPS_API_KEY");

  if (!apiKey) {
    console.warn("Skipping Loops billing sync: LOOPS_API_KEY is not set");
    return;
  }

  const contacts = await getOrganizationContacts(snapshot.organizationId);
  const billingProperties = getBillingLoopsContactProperties(snapshot);
  const logContext = {
    action: "billing-contact-sync",
    organizationId: snapshot.organizationId,
  };

  for (const contact of contacts) {
    const canManageBilling = hasOrgPermission(contact.role, {
      billing: ["manage"],
    });
    for (const event of canManageBilling ? events : []) {
      await sendLoopsEvent({
        apiKey,
        idempotencyKey: `${event.name}:${snapshot.organizationId}:${contact.userId}:${previousSyncedAt}`,
        payload: {
          email: contact.email,
          userId: contact.userId,
          eventName: event.name,
          eventProperties: { planId: event.planId },
        },
        logContext,
      });
    }

    await updateLoopsContact({
      apiKey,
      payload: {
        email: contact.email,
        userId: contact.userId,
        userGroup: "app-user",
        ...getContactNameParts(contact.name),
        ...billingProperties,
      },
      logContext,
    });
  }
}

async function getOrganizationContacts(organizationId: string) {
  return db
    .select({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId));
}
