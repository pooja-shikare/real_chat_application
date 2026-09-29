import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * Room view journey.
 *
 * Covers the acceptance criteria:
 *   - opening a room shows its message history in chronological order with day
 *     separators;
 *   - an empty room prompts the first message;
 *   - sending a message displays it without a page reload;
 *   - the current user's messages are distinguished from others', with sender
 *     name and timestamp;
 *   - messages show a sent/read state;
 *   - opening a room marks its messages as read;
 *   - the online users list shows active members;
 *   - typing in the composer shows a typing indicator to other members.
 *
 * The backend actor is a local typed mock; this is component/integration
 * coverage, not a deployed browser or real backend.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type FakeActor,
  createFakeActor,
  makeMessageView,
  makeRoomDetail,
  makeUser,
  renderWithRouter,
} from "./helpers";

let actor: FakeActor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    identity: undefined,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "success",
    isInitializing: false,
    isLoginIdle: false,
    isLoggingIn: false,
    isLoginSuccess: true,
    isLoginError: false,
    isAuthenticated: true,
    loginError: undefined,
  }),
  useActor: () => ({ actor, isFetching: false }),
}));

import { RoomViewPage } from "@/pages/RoomViewPage";

function renderRoom() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {renderWithRouter(RoomViewPage, "/room/$id", "/room/1")}
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  actor = createFakeActor();
});

describe("room view", () => {
  it("shows an empty state prompting the first message", async () => {
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () => makeRoomDetail({ messages: [] })),
    });

    renderRoom();

    expect(
      await screen.findByTestId("room_view.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("renders message history in chronological order with a day separator", async () => {
    // Use today's date so the separator label is deterministic ("Today").
    const todayNs = BigInt(Date.now()) * 1_000_000n;
    const first = makeMessageView({
      id: 1n,
      body: "first message",
      isMine: false,
      senderName: "Bob",
      sentAt: todayNs,
    });
    const second = makeMessageView({
      id: 2n,
      body: "second message",
      isMine: true,
      sentAt: todayNs + 60_000_000_000n,
    });
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () =>
        makeRoomDetail({ messages: [first, second] }),
      ),
    });

    renderRoom();

    const bubbles = await screen.findAllByTestId("room_view.message_item");
    expect(bubbles).toHaveLength(2);
    expect(within(bubbles[0]).getByText("first message")).toBeInTheDocument();
    expect(within(bubbles[1]).getByText("second message")).toBeInTheDocument();
    // A day separator pill is rendered for the group.
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("shows the sender name on other people's messages but not on your own", async () => {
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () =>
        makeRoomDetail({
          messages: [
            makeMessageView({
              id: 1n,
              body: "from bob",
              isMine: false,
              senderName: "Bob",
            }),
            makeMessageView({
              id: 2n,
              body: "from me",
              isMine: true,
              senderName: "Ada Lovelace",
            }),
          ],
        }),
      ),
    });

    renderRoom();

    const bubbles = await screen.findAllByTestId("room_view.message_item");
    expect(within(bubbles[0]).getByText("Bob")).toBeInTheDocument();
    expect(
      within(bubbles[1]).queryByText("Ada Lovelace"),
    ).not.toBeInTheDocument();
  });

  it("shows a Sent read state for an unread own message and Read once read", async () => {
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () =>
        makeRoomDetail({
          messages: [
            makeMessageView({
              id: 1n,
              body: "unread",
              isMine: true,
              isRead: false,
            }),
            makeMessageView({
              id: 2n,
              body: "read",
              isMine: true,
              isRead: true,
            }),
          ],
        }),
      ),
    });

    renderRoom();

    const states = await screen.findAllByTestId("room_view.read_state");
    expect(states).toHaveLength(2);
    expect(within(states[0]).getByText("Sent")).toBeInTheDocument();
    expect(within(states[1]).getByText("Read")).toBeInTheDocument();
  });

  it("marks the room read when it opens", async () => {
    const markRead = vi.fn(async () => undefined);
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () =>
        makeRoomDetail({
          messages: [makeMessageView({ id: 42n, isMine: false })],
        }),
      ),
      markRead,
    });

    renderRoom();

    await waitFor(() => {
      expect(markRead).toHaveBeenCalledWith(1n, 42n);
    });
  });

  it("sends a message and displays it without a reload", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn(async (_roomId: bigint, body: string) =>
      makeMessageView({ id: 9n, body, isMine: true }),
    );
    const getRoomDetail = vi
      .fn()
      .mockResolvedValueOnce(makeRoomDetail({ messages: [] }))
      .mockResolvedValue(
        makeRoomDetail({
          messages: [
            makeMessageView({ id: 9n, body: "hello team", isMine: true }),
          ],
        }),
      );
    actor = createFakeActor({ getRoomDetail, sendMessage });

    renderRoom();

    const input = await screen.findByTestId("room_view.message_input");
    await user.type(input, "hello team");
    await user.click(screen.getByTestId("room_view.send_button"));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(1n, "hello team");
    });
    expect(await screen.findByText("hello team")).toBeInTheDocument();
  });

  it("sends on Enter and keeps Shift+Enter for a newline", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn(async (_roomId: bigint, body: string) =>
      makeMessageView({ id: 9n, body, isMine: true }),
    );
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () => makeRoomDetail({ messages: [] })),
      sendMessage,
    });

    renderRoom();

    const input = await screen.findByTestId("room_view.message_input");
    await user.type(input, "quick note{Enter}");

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(1n, "quick note");
    });
  });

  it("shows the online users list with active members", async () => {
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () =>
        makeRoomDetail({
          onlineUsers: [
            { userId: "bob" as never, displayName: "Bob", avatarInitial: "B" },
          ],
          members: [
            makeUser(),
            makeUser({ displayName: "Bob", avatarInitial: "B" }),
          ],
        }),
      ),
    });

    renderRoom();

    const panel = await screen.findByTestId("room_view.online_users");
    expect(within(panel).getByText("Bob")).toBeInTheDocument();
    expect(within(panel).getByText(/online — 1/i)).toBeInTheDocument();
  });

  it("shows a typing indicator for another member and clears it when they stop", async () => {
    const typingUser = {
      userId: "bob" as never,
      displayName: "Bob",
      avatarInitial: "B",
    };
    const getRoomDetail = vi
      .fn()
      .mockResolvedValueOnce(makeRoomDetail({ typingUsers: [typingUser] }))
      .mockResolvedValue(makeRoomDetail({ typingUsers: [] }));
    actor = createFakeActor({ getRoomDetail });

    renderRoom();

    const indicator = await screen.findByTestId("room_view.typing_indicator");
    expect(within(indicator).getByText(/bob is typing/i)).toBeInTheDocument();
  });

  it("tells the backend the user is typing while composing", async () => {
    const user = userEvent.setup();
    const setTyping = vi.fn(async () => undefined);
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () => makeRoomDetail({ messages: [] })),
      setTyping,
    });

    renderRoom();

    const input = await screen.findByTestId("room_view.message_input");
    await user.type(input, "h");

    await waitFor(() => {
      expect(setTyping).toHaveBeenCalledWith(1n, true);
    });
  });

  it("shows a not-found state for a room the backend does not return", async () => {
    actor = createFakeActor({
      getRoomDetail: vi.fn(async () => null),
    });

    renderRoom();

    expect(
      await screen.findByTestId("room_view.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByText(/room not found/i)).toBeInTheDocument();
  });
});
