// TEMPORARY SHIM - This file will be auto-generated when `npx convex dev` runs
// DO NOT COMMIT - Add to .gitignore
//
// Uses Convex's anyApi Proxy which creates valid FunctionReference objects
// for any property path (e.g. api.documents.listDocuments returns a proper
// function reference with the internal Symbol). This allows useQuery/useMutation
// to validate the reference even when skipping queries.

import { anyApi } from "convex/server";

export const api = anyApi;
export const internal = anyApi;
