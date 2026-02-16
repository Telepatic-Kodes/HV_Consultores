import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    Google,
    Resend({
      from: process.env.AUTH_RESEND_FROM ?? "HV Consultores <noreply@hvconsultores.cl>",
    }),
  ],
});
