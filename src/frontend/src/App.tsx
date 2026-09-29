/**
 * App root: providers, authentication gating, and the router.
 *
 * Flow:
 *   1. Not signed in            -> SignInGate
 *   2. Signed in, no profile    -> ProfileSetup
 *   3. Signed in with profile   -> Layout + routes
 *
 * The room list is the default route; the room view lives at `/room/:id`.
 * The page bodies are implemented in separate files under `src/pages/`.
 */
import { Layout } from "@/components/Layout";
import { ProfileSetup } from "@/components/ProfileSetup";
import { SignInGate } from "@/components/SignInGate";
import { useMyProfile } from "@/hooks/useChat";
import { RoomListPage } from "@/pages/RoomListPage";
import { RoomViewPage } from "@/pages/RoomViewPage";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

/** Full-screen loading state while identity or profile is resolving. */
function FullScreenLoader() {
  return (
    <div
      data-ocid="app.loading_state"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">Loading your workspace…</span>
      </div>
    </div>
  );
}

/** Root route: renders the matched child route. */
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

/** Default route — the room list. */
const roomListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RoomListPage,
});

/** Room view route — `/room/:id`. */
const roomViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/room/$id",
  component: RoomViewPage,
});

const routeTree = rootRoute.addChildren([roomListRoute, roomViewRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Chooses the correct screen based on auth and profile state. */
function AuthenticatedApp() {
  const profile = useMyProfile();

  if (profile.isLoading) return <FullScreenLoader />;
  if (!profile.data) return <ProfileSetup />;

  return (
    <Layout profile={profile.data}>
      <RouterProvider router={router} />
    </Layout>
  );
}

export default function App() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  if (isInitializing) return <FullScreenLoader />;
  if (!isAuthenticated) return <SignInGate />;

  return <AuthenticatedApp />;
}
