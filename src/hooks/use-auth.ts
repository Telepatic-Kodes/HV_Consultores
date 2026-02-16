"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip"
  );

  return {
    isAuthenticated,
    isLoading: authLoading || (isAuthenticated && profile === undefined),
    profile: profile ?? null,
  };
}
