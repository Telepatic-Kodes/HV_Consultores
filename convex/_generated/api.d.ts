/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertRules from "../alertRules.js";
import type * as analytics from "../analytics.js";
import type * as anomalies from "../anomalies.js";
import type * as audit from "../audit.js";
import type * as banks from "../banks.js";
import type * as bots from "../bots.js";
import type * as chat from "../chat.js";
import type * as clients from "../clients.js";
import type * as currency from "../currency.js";
import type * as documents from "../documents.js";
import type * as f29 from "../f29.js";
import type * as matching from "../matching.js";
import type * as notifications from "../notifications.js";
import type * as pipeline from "../pipeline.js";
import type * as profiles from "../profiles.js";
import type * as scheduledReports from "../scheduledReports.js";
import type * as seed from "../seed.js";
import type * as templates from "../templates.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertRules: typeof alertRules;
  analytics: typeof analytics;
  anomalies: typeof anomalies;
  audit: typeof audit;
  banks: typeof banks;
  bots: typeof bots;
  chat: typeof chat;
  clients: typeof clients;
  currency: typeof currency;
  documents: typeof documents;
  f29: typeof f29;
  matching: typeof matching;
  notifications: typeof notifications;
  pipeline: typeof pipeline;
  profiles: typeof profiles;
  scheduledReports: typeof scheduledReports;
  seed: typeof seed;
  templates: typeof templates;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
