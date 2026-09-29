import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * Auth and profile journey.
 *
 * Covers the acceptance criteria:
 *   - an unauthenticated visitor is prompted to sign in with Internet Identity
 *     before reaching any chat screen;
 *   - after signing in, a user without a profile is asked for a display name;
 *   - the header shows the signed-in user's name and avatar initial;
 *   - signing out returns to the sign-in screen.
 *
 * The backend actor and the Internet Identity context are local mocks; this is
 * component/integration coverage, not a deployed browser or real II flow.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type FakeActor, createFakeActor, makeUser } from "./helpers";

/** Mutable state the mocked core-infrastructure reads on each render. */
const authState = {
  isAuthenticated: false,
  isInitializing: false,
  login: vi.fn(),
  clear: vi.fn(),
};
let actor: FakeActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    identity: undefined,
    login: authState.login,
    clear: authState.clear,
    loginStatus: authState.isAuthenticated ? "success" : "idle",
    isInitializing: authState.isInitializing,
    isLoginIdle: !authState.isAuthenticated,
    isLoggingIn: false,
    isLoginSuccess: authState.isAuthenticated,
    isLoginError: false,
    isAuthenticated: authState.isAuthenticated,
    loginError: undefined,
  }),
  useActor: () => ({ actor, isFetching: false }),
}));

import App from "@/App";

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isInitializing = false;
  authState.login = vi.fn();
  authState.clear = vi.fn();
  actor = createFakeActor();
});

describe("authentication gate", () => {
  it("prompts an unauthenticated visitor to sign in with Internet Identity", async () => {
    renderApp();

    expect(
      await screen.findByRole("button", {
        name: /sign in with internet identity/i,
      }),
    ).toBeInTheDocument();
    // No chat surface is reachable before sign-in.
    expect(screen.queryByTestId("room_list.page")).not.toBeInTheDocument();
  });

  it("calls login when the sign-in button is clicked", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      await screen.findByRole("button", {
        name: /sign in with internet identity/i,
      }),
    );

    expect(authState.login).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while identity is initializing", () => {
    authState.isInitializing = true;
    renderApp();

    expect(screen.getByTestId("app.loading_state")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sign in with internet identity/i }),
    ).not.toBeInTheDocument();
  });
});

describe("profile setup", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    actor = createFakeActor({ getMyProfile: vi.fn(async () => null) });
  });

  it("asks a signed-in user without a profile to choose a display name", async () => {
    renderApp();

    expect(
      await screen.findByRole("heading", { name: /choose your display name/i }),
    ).toBeInTheDocument();
  });

  it("registers the trimmed display name and then shows the chat", async () => {
    const user = userEvent.setup();
    const registerUser = vi.fn(async (displayName: string) =>
      makeUser({ displayName }),
    );
    actor = createFakeActor({
      getMyProfile: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValue(makeUser({ displayName: "Grace Hopper" })),
      registerUser,
    });

    renderApp();

    const input = await screen.findByTestId("profile.input");
    await user.type(input, "  Grace Hopper  ");
    await user.click(screen.getByTestId("profile.submit_button"));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith("Grace Hopper");
    });
    // The room list is the default route once a profile exists.
    expect(await screen.findByTestId("room_list.page")).toBeInTheDocument();
  });

  it("keeps the submit button disabled until a name is entered", async () => {
    const user = userEvent.setup();
    renderApp();

    const submit = await screen.findByTestId("profile.submit_button");
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId("profile.input"), "Ada");
    expect(submit).toBeEnabled();
  });
});

describe("signed-in shell", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    actor = createFakeActor({
      getMyProfile: vi.fn(async () =>
        makeUser({ displayName: "Ada Lovelace", avatarInitial: "A" }),
      ),
    });
  });

  it("shows the signed-in user's name and avatar initial in the header", async () => {
    renderApp();

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("signs out from the header", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByTestId("header.signout_button"));

    expect(authState.clear).toHaveBeenCalledTimes(1);
  });
});
