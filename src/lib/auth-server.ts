'use server'

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Get the first profile ID (no auth required).
 */
export async function getServerProfileId(): Promise<Id<"profiles">> {
  const profiles = await convex.query(api.profiles.listProfiles, { activo: true });
  if (!profiles || profiles.length === 0) {
    throw new Error("No profiles found");
  }
  return profiles[0]._id;
}

/**
 * Get a ConvexHttpClient instance.
 */
export async function getAuthenticatedConvex(): Promise<ConvexHttpClient> {
  return convex;
}
