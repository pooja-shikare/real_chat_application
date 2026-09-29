import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * Room list journey.
 *
 * Covers the acceptance criteria:
 *   - after signing in, the user sees a room list;
 *   - a room card shows name, description, member count, and last-message
 *     preview;
 *   - creating a room makes it appear in the list;
 *   - joining and leaving a room updates its membership;
 *   - joined rooms appear under "My Rooms".
 *
 * Rendered through the real `App` so the router and layout are exercised. The
 * backend actor is a local typed mock.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type FakeActor,
  createFakeActor,
  makeRoomSummary,
  makeUser,
} from "./helpers";

const authState = {
  isAuthenticated: true,
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
    loginStatus: "success",
    isInitializing: authState.isInitializing,
    isLoginIdle: false,
    isLoggingIn: false,
    isLoginSuccess: true,
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
  authState.isAuthenticated = true;
  actor = createFakeActor({
    getMyProfile: vi.fn(async () => makeUser({ displayName: "Ada Lovelace" })),
  });
});

describe("room list", () => {
  it("shows an empty state when there are no rooms", async () => {
    renderApp();

    expect(
      await screen.findByTestId("room_list.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText(/no rooms yet/i)).toBeInTheDocument();
  });

  it("renders each room with name, description, member count, and preview", async () => {
    actor = createFakeActor({
      getMyProfile: vi.fn(async () =>
        makeUser({ displayName: "Ada Lovelace" }),
      ),
      listRooms: vi.fn(async () => [
        makeRoomSummary({
          id: 1n,
          name: "General",
          description: "Everyone welcome",
          memberCount: 3n,
          lastMessagePreview: "see you tomorrow",
          isMember: false,
        }),
      ]),
    });

    renderApp();

    const card = await screen.findByTestId("room_list.item.1");
    expect(within(card).getByText("General")).toBeInTheDocument();
    expect(within(card).getByText("Everyone welcome")).toBeInTheDocument();
    expect(within(card).getByText(/3 members/i)).toBeInTheDocument();
    expect(within(card).getByText("see you tomorrow")).toBeInTheDocument();
  });

  it("shows a friendly preview when a room has no messages", async () => {
    actor = createFakeActor({
      getMyProfile: vi.fn(async () => makeUser()),
      listRooms: vi.fn(async () => [
        makeRoomSummary({ id: 1n, name: "Quiet", lastMessagePreview: "" }),
      ]),
    });

    renderApp();

    const card = await screen.findByTestId("room_list.item.1");
    expect(within(card).getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("lists joined rooms under My Rooms", async () => {
    actor = createFakeActor({
      getMyProfile: vi.fn(async () => makeUser()),
      listRooms: vi.fn(async () => [
        makeRoomSummary({ id: 1n, name: "Joined room", isMember: true }),
        makeRoomSummary({ id: 2n, name: "Discover room", isMember: false }),
      ]),
    });

    renderApp();

    const myRooms = await screen.findByRole("heading", { name: "My Rooms" });
    const section = myRooms.closest("section");
    expect(section).not.toBeNull();
    expect(
      within(section as HTMLElement).getByText("Joined room"),
    ).toBeInTheDocument();
    expect(
      within(section as HTMLElement).queryByText("Discover room"),
    ).not.toBeInTheDocument();
  });

  it("creates a room and shows it in the list", async () => {
    const user = userEvent.setup();
    const created = makeRoomSummary({
      id: 7n,
      name: "Project Standup",
      description: "Daily sync",
      isMember: true,
      memberCount: 1n,
    });
    const listRooms = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValue([created]);
    const createRoom = vi.fn(async () => ({
      id: 7n,
      name: "Project Standup",
      description: "Daily sync",
      createdBy: "self-principal" as never,
      createdAt: 1_700_000_000_000_000_000n,
    }));
    actor = createFakeActor({
      getMyProfile: vi.fn(async () => makeUser()),
      listRooms,
      createRoom,
    });

    renderApp();

    await user.click(await screen.findByTestId("room_list.create_room_button"));
    await user.type(
      await screen.findByTestId("create_room.name_input"),
      "Project Standup",
    );
    await user.type(
      screen.getByTestId("create_room.description_input"),
      "Daily sync",
    );
    await user.click(screen.getByTestId("create_room.submit_button"));

    await waitFor(() => {
      expect(createRoom).toHaveBeenCalledWith("Project Standup", "Daily sync");
    });
    expect(await screen.findByText("Project Standup")).toBeInTheDocument();
  });

  it("joins a room and moves it into My Rooms", async () => {
    const user = userEvent.setup();
    const joinRoom = vi.fn(async () => true);
    const listRooms = vi
      .fn()
      .mockResolvedValueOnce([
        makeRoomSummary({ id: 1n, name: "General", isMember: false }),
      ])
      .mockResolvedValue([
        makeRoomSummary({ id: 1n, name: "General", isMember: true }),
      ]);
    actor = createFakeActor({
      getMyProfile: vi.fn(async () => makeUser()),
      listRooms,
      joinRoom,
    });

    renderApp();

    await user.click(await screen.findByTestId("room_list.join_button.1"));

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(1n);
    });
    const myRooms = await screen.findByRole("heading", { name: "My Rooms" });
    const section = myRooms.closest("section") as HTMLElement;
    expect(within(section).getByText("General")).toBeInTheDocument();
  });

  it("leaves a room and removes it from My Rooms", async () => {
    const user = userEvent.setup();
    const leaveRoom = vi.fn(async () => true);
    const listRooms = vi
      .fn()
      .mockResolvedValueOnce([
        makeRoomSummary({ id: 1n, name: "General", isMember: true }),
      ])
      .mockResolvedValue([
        makeRoomSummary({ id: 1n, name: "General", isMember: false }),
      ]);
    actor = createFakeActor({
      getMyProfile: vi.fn(async () => makeUser()),
      listRooms,
      leaveRoom,
    });

    renderApp();

    await user.click(await screen.findByTestId("room_list.leave_button.1"));

    await waitFor(() => {
      expect(leaveRoom).toHaveBeenCalledWith(1n);
    });
    const myRooms = await screen.findByRole("heading", { name: "My Rooms" });
    const section = myRooms.closest("section") as HTMLElement;
    expect(within(section).queryByText("General")).not.toBeInTheDocument();
  });
});
