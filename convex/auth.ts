import { AuthKit } from "@convex-dev/workos-authkit";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  clientId: process.env.WORKOS_CLIENT_ID,
  apiKey: process.env.WORKOS_API_KEY,
  webhookSecret: process.env.WORKOS_WEBHOOK_SECRET ?? "dev-webhook-secret",
});
