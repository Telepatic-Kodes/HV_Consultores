"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, useContext, ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Always create a client — use a placeholder URL when not configured.
// Queries will be skipped via 'skip' arg in hooks when not properly configured.
const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

// Context to let hooks know if Convex is properly configured
const ConvexAvailableContext = createContext(false);
export function useConvexAvailable() {
  return useContext(ConvexAvailableContext);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAvailableContext.Provider value={!!convexUrl}>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}
