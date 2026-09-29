/**
 * Typed wrappers around the generated backend actor.
 *
 * The generated `src/backend.ts` file is created by the build tool and must
 * never be edited. This module is the single place where the rest of the app
 * talks to the backend, so every call is easy to find and easy to read.
 *
 * Each function takes the actor as its first argument and simply forwards to
 * the matching backend method. Keeping them here means hooks and components
 * never import the generated bindings directly.
 */
import type {
  Backend,
  Message,
  MessageId,
  Room,
  RoomDetail,
  RoomId,
  RoomSummary,
  User,
} from "@/backend";

/** The actor type returned by `useActor(createActor)`. */
export type ChatActor = Backend;

/** Create the signed-in user's profile. Returns the new profile. */
export function registerUser(
  actor: ChatActor,
  displayName: string,
): Promise<User> {
  return actor.registerUser(displayName);
}

/** Fetch the signed-in user's profile, or `null` if they have not registered. */
export function getMyProfile(actor: ChatActor): Promise<User | null> {
  return actor.getMyProfile();
}

/** Create a room. The creator automatically becomes its first member. */
export function createRoom(
  actor: ChatActor,
  name: string,
  description: string,
): Promise<Room> {
  return actor.createRoom(name, description);
}

/** List every room with its member count and last-message preview. */
export function listRooms(actor: ChatActor): Promise<RoomSummary[]> {
  return actor.listRooms();
}

/** Fetch a room's full detail (members, presence, typing, messages). */
export function getRoomDetail(
  actor: ChatActor,
  roomId: RoomId,
): Promise<RoomDetail | null> {
  return actor.getRoomDetail(roomId);
}

/** Join a room. Returns `true` when the caller is now a member. */
export function joinRoom(actor: ChatActor, roomId: RoomId): Promise<boolean> {
  return actor.joinRoom(roomId);
}

/** Leave a room. Returns `true` when the caller is no longer a member. */
export function leaveRoom(actor: ChatActor, roomId: RoomId): Promise<boolean> {
  return actor.leaveRoom(roomId);
}

/** Send a message to a room. Returns the stored message, or `null` on failure. */
export function sendMessage(
  actor: ChatActor,
  roomId: RoomId,
  body: string,
): Promise<Message | null> {
  return actor.sendMessage(roomId, body);
}

/** List a room's messages in chronological order. */
export function listMessages(
  actor: ChatActor,
  roomId: RoomId,
): Promise<Message[]> {
  return actor.listMessages(roomId);
}

/** Tell the backend the caller is still active in a room (presence). */
export function heartbeat(actor: ChatActor, roomId: RoomId): Promise<void> {
  return actor.heartbeat(roomId);
}

/** Tell the backend whether the caller is currently typing in a room. */
export function setTyping(
  actor: ChatActor,
  roomId: RoomId,
  isTyping: boolean,
): Promise<void> {
  return actor.setTyping(roomId, isTyping);
}

/** Mark every message up to `lastReadMessageId` as read for the caller. */
export function markRead(
  actor: ChatActor,
  roomId: RoomId,
  lastReadMessageId: MessageId,
): Promise<void> {
  return actor.markRead(roomId, lastReadMessageId);
}
