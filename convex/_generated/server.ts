// TEMPORARY SHIM - This file will be auto-generated when `npx convex dev` runs
// DO NOT COMMIT - Add to .gitignore

type QueryCtx = {
  db: {
    query: (table: string) => any;
    get: (id: any) => any;
  };
  auth: { getUserIdentity: () => Promise<any> };
};

type MutationCtx = QueryCtx & {
  db: QueryCtx["db"] & {
    insert: (table: string, doc: any) => any;
    patch: (id: any, fields: any) => any;
    replace: (id: any, doc: any) => any;
    delete: (id: any) => any;
  };
};

type ActionCtx = {
  runQuery: (ref: any, args: any) => Promise<any>;
  runMutation: (ref: any, args: any) => Promise<any>;
};

interface FunctionDef {
  args: Record<string, any>;
  handler: (ctx: any, args: any) => any;
}

export const query = (def: FunctionDef) => def;
export const mutation = (def: FunctionDef) => def;
export const action = (def: FunctionDef) => def;
export const internalQuery = (def: FunctionDef) => def;
export const internalMutation = (def: FunctionDef) => def;
export const internalAction = (def: FunctionDef) => def;
