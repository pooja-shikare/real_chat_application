/**
 * Shared test helpers for the frontend suite.
 *
 * The app's only backend seam is `@caffeineai/core-infrastructure`:
 *   - `useInternetIdentity()` supplies auth state and `login`/`clear`.
 *   - `useActor(createActor)` supplies the typed backend actor.
 *
 * Both are mocked here so tests drive real components and real React Query
 * hooks against a local, typed fake actor. No network, no real identity.
 *
 * The fake actor is typed as the app's own `Backend` interface, so a change to
 * the generated API breaks these tests at type-check time rather than silently
 * passing against a stale shape.
 */
import type { Backend } from "@/backend";
import type {
  Message,
  MessageView,
  RoomDetail,
  RoomSummary,
  User,
} from "@/types/chat";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { type ReactNode, createElement } from "react";
import { vi } from "vitest";

/** A deterministic principal-like string for the signed-in user. */
export const SELF_ID = "self-principal";

/** Build a `User` view. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: SELF_ID as unknown as User["id"],
    displayName: "Ada Lovelace",
    avatarInitial: "A",
    joinedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/** Build a `RoomSummary` view. */
export function makeRoomSummary(
  overrides: Partial<RoomSummary> = {},
): RoomSummary {
  return {
    id: 1n,
    name: "General",
    description: "Everyone welcome",
    memberCount: 1n,
    lastMessagePreview: "",
    lastMessageAt: undefined,
    isMember: false,
    ...overrides,
  };
}

/** Build a `MessageView`. */
export function makeMessageView(
  overrides: Partial<MessageView> = {},
): MessageView {
  return {
    id: 1n,
    roomId: 1n,
    sender: SELF_ID as unknown as MessageView["sender"],
    senderName: "Ada Lovelace",
    body: "hello",
    sentAt: 1_700_000_000_000_000_000n,
    isMine: true,
    isRead: false,
    ...overrides,
  };
}

/** Build a `RoomDetail` view. */
export function makeRoomDetail(
  overrides: Partial<RoomDetail> = {},
): RoomDetail {
  return {
    room: {
      id: 1n,
      name: "General",
      description: "Everyone welcome",
      createdBy: SELF_ID as unknown as RoomDetail["room"]["createdBy"],
      createdAt: 1_700_000_000_000_000_000n,
    },
    members: [makeUser()],
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    ...overrides,
  };
}

/** Build a `Message` (the raw stored shape returned by `sendMessage`). */
export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1n,
    roomId: 1n,
    sender: SELF_ID as unknown as Message["sender"],
    senderName: "Ada Lovelace",
    body: "hello",
    sentAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/**
 * A typed fake backend. Every method is a `vi.fn` so tests can assert on the
 * calls the app made, and each has a sensible default so a test only has to
 * override the methods it cares about.
 */
export type FakeActor = {
  [K in keyof Backend]: Backend[K] extends (...args: infer A) => infer R
    ? ReturnType<typeof vi.fn<(...args: A) => R>>
    : never;
};

export function createFakeActor(overrides: Partial<FakeActor> = {}): FakeActor {
  const base = {
    registerUser: vi.fn(async (displayName: string) =>
      makeUser({ displayName }),
    ),
    getMyProfile: vi.fn(async () => makeUser()),
    createRoom: vi.fn(async (name: string, description: string) => ({
      id: 1n,
      name,
      description,
      createdBy: SELF_ID as unknown as RoomDetail["room"]["createdBy"],
      createdAt: 1_700_000_000_000_000_000n,
    })),
    listRooms: vi.fn(async () => [] as RoomSummary[]),
    getRoomDetail: vi.fn(async () => makeRoomDetail()),
    joinRoom: vi.fn(async () => true),
    leaveRoom: vi.fn(async () => true),
    sendMessage: vi.fn(async (_roomId: bigint, body: string) =>
      makeMessage({ body }),
    ),
    listMessages: vi.fn(async () => [] as Message[]),
    heartbeat: vi.fn(async () => undefined),
    setTyping: vi.fn(async () => undefined),
    markRead: vi.fn(async () => undefined),
  };
  return { ...base, ...overrides } as unknown as FakeActor;
}

/**
 * Render a page component inside a minimal memory-history router.
 *
 * `RoomViewPage` reads `useParams` and renders `Link`s, so it needs a router
 * context. Building one here keeps the test focused on the page rather than on
 * the app's module-scoped browser router, whose initial path is fixed at import
 * time and cannot vary per test.
 *
 * `routePath` is the route pattern (e.g. `/room/$id`); `initialPath` is the
 * concrete URL to start at (e.g. `/room/1`).
 */
export function renderWithRouter(
  component: () => ReactNode,
  routePath: string,
  initialPath: string,
) {
  const rootRoute = createRootRoute({ component: () => createElement(Outlet) });
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: routePath,
    component,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute, indexRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return createElement(RouterProvider, { router });
}
