import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/login", "/registro", "/recuperar"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuth = await convexAuth.isAuthenticated();

  // Redirect unauthenticated users away from protected routes
  if (!isPublicRoute(request) && !isAuth) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute(request) && isAuth) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
