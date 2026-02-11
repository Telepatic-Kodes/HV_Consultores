// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

/**
 * List all profiles
 */
export const listProfiles = query({
  args: {
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db.query("profiles").collect();

    // Filter by activo status
    if (args.activo !== undefined) {
      profiles = profiles.filter((p) => p.activo === args.activo);
    }

    return profiles;
  },
});

/**
 * Get single profile by ID
 */
export const getProfile = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get profile with roles
 */
export const getProfileWithRoles = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.id);

    if (!profile) {
      return null;
    }

    // Get user roles
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q: any) => q.eq("user_id", args.id))
      .collect();

    // Get role details
    const roles = [];
    for (const userRole of userRoles) {
      const role = await ctx.db.get(userRole.role_id);
      if (role) {
        roles.push(role);
      }
    }

    return {
      ...profile,
      roles,
    };
  },
});

/**
 * Search profiles by name
 */
export const searchProfiles = query({
  args: {
    searchTerm: v.string(),
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db.query("profiles").collect();

    // Filter by activo
    if (args.activo !== undefined) {
      profiles = profiles.filter((p) => p.activo === args.activo);
    }

    // Filter by search term
    const searchLower = args.searchTerm.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.nombre_completo.toLowerCase().includes(searchLower) ||
        (p.cargo && p.cargo.toLowerCase().includes(searchLower))
    );

    return profiles;
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

/**
 * Create profile
 */
export const createProfile = mutation({
  args: {
    nombre_completo: v.string(),
    cargo: v.optional(v.string()),
    telefono: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const profileId = await ctx.db.insert("profiles", {
      nombre_completo: args.nombre_completo,
      cargo: args.cargo,
      telefono: args.telefono,
      avatar_url: args.avatar_url,
      activo: args.activo ?? true,
      created_at: now,
      updated_at: now,
    });

    return profileId;
  },
});

/**
 * Update profile
 */
export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    nombre_completo: v.optional(v.string()),
    cargo: v.optional(v.string()),
    telefono: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });

    return id;
  },
});

/**
 * Delete profile (soft delete)
 */
export const deleteProfile = mutation({
  args: {
    id: v.id("profiles"),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.hardDelete) {
      // Hard delete - remove user roles first
      const userRoles = await ctx.db
        .query("user_roles")
        .withIndex("by_user", (q: any) => q.eq("user_id", args.id))
        .collect();

      for (const userRole of userRoles) {
        await ctx.db.delete(userRole._id);
      }

      await ctx.db.delete(args.id);
    } else {
      // Soft delete
      await ctx.db.patch(args.id, {
        activo: false,
        updated_at: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

// ─── ROLES QUERIES ─────────────────────────────────────────

/**
 * List all roles
 */
export const listRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roles").collect();
  },
});

/**
 * Get role by ID
 */
export const getRole = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get user roles
 */
export const getUserRoles = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q: any) => q.eq("user_id", args.userId))
      .collect();

    const roles = [];
    for (const userRole of userRoles) {
      const role = await ctx.db.get(userRole.role_id);
      if (role) {
        roles.push(role);
      }
    }

    return roles;
  },
});

// ─── ROLES MUTATIONS ───────────────────────────────────────

/**
 * Assign role to user
 */
export const assignRole = mutation({
  args: {
    user_id: v.id("profiles"),
    role_id: v.id("roles"),
    assigned_by: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    // Check if user already has this role
    const existing = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q: any) => q.eq("user_id", args.user_id))
      .collect();

    const hasRole = existing.some((ur) => ur.role_id === args.role_id);

    if (hasRole) {
      return { success: false, message: "User already has this role" };
    }

    const userRoleId = await ctx.db.insert("user_roles", {
      user_id: args.user_id,
      role_id: args.role_id,
      assigned_by: args.assigned_by,
      assigned_at: new Date().toISOString(),
    });

    return { success: true, id: userRoleId };
  },
});

/**
 * Remove role from user
 */
export const removeRole = mutation({
  args: {
    user_id: v.id("profiles"),
    role_id: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const userRoles = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q: any) => q.eq("user_id", args.user_id))
      .collect();

    const userRole = userRoles.find((ur) => ur.role_id === args.role_id);

    if (!userRole) {
      return { success: false, message: "User does not have this role" };
    }

    await ctx.db.delete(userRole._id);

    return { success: true };
  },
});
