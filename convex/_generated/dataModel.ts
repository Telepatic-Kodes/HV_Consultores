// TEMPORARY SHIM - This file will be auto-generated when `npx convex dev` runs
// DO NOT COMMIT - Add to .gitignore

export type Id<T extends string> = string & { __tableName: T }

export type DataModel = Record<string, any>

export type Doc<T extends string> = Record<string, any> & { _id: Id<T> }
