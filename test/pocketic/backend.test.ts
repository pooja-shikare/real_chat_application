/**
 * PocketIC backend lane for the chat app.
 *
 * Installs the app's own compiled `src/backend/dist/backend.wasm` into the
 * platform's PocketIC replica and calls the real public API. The frontend suite
 * mocks the actor, so it passes unchanged against a canister whose public
 * methods are all `Debug.todo()` stubs; this file is what actually executes the
 * backend.
 *
 * Shapes come from the generated agent-js declarations, not the app's
 * TypeScript wrapper: `?T` is `[] | [T]`, `Nat`/`Int` are `bigint`, and a
 * method returning unit resolves to `null`.
 */
import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

/** Deterministic callers; the same seed names the same principal every run. */
const alice = createIdentity("alice");
const bob = createIdentity("bob");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far; a failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  actor.setIdentity(alice);
  await expect(actor.listRooms()).resolves.toEqual([]);
  await expect(actor.getMyProfile()).resolves.toEqual([]);
  await expect(actor.getRoomDetail(0n)).resolves.toEqual([]);
});

it("registers a profile and reads it back for the same caller", async () => {
  actor.setIdentity(alice);
  const user = await actor.registerUser("Ada Lovelace");
  expect(user).toMatchObject({ displayName: "Ada Lovelace", avatarInitial: "A" });

  const profile = await actor.getMyProfile();
  expect(profile).toHaveLength(1);
  expect(profile[0]).toMatchObject({ displayName: "Ada Lovelace" });
});

it("creates a room and makes the creator its first member", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Standup", "Daily sync");
  expect(room).toMatchObject({ name: "Standup", description: "Daily sync" });

  const rooms = await actor.listRooms();
  const created = rooms.find((r) => r.id === room.id);
  expect(created).toBeDefined();
  expect(created).toMatchObject({ memberCount: 1n, isMember: true });

  const detail = await actor.getRoomDetail(room.id);
  expect(detail).toHaveLength(1);
  expect(detail[0].members).toHaveLength(1);
});

it("round-trips a message through the real canister", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Round trip", "");
  const sent = await actor.sendMessage(room.id, "hello world");
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ body: "hello world", senderName: "Ada Lovelace" });

  const detail = await actor.getRoomDetail(room.id);
  expect(detail[0].messages).toHaveLength(1);
  expect(detail[0].messages[0]).toMatchObject({ body: "hello world", isMine: true });
});

it("rejects a message from a non-member", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Members only", "");

  actor.setIdentity(bob);
  await actor.registerUser("Bob");
  await expect(actor.sendMessage(room.id, "let me in")).resolves.toEqual([]);
});

it("lets a second caller join and see the first caller's message", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Shared", "");
  await actor.sendMessage(room.id, "first");

  actor.setIdentity(bob);
  await actor.registerUser("Bob");
  await expect(actor.joinRoom(room.id)).resolves.toBe(true);

  const detail = await actor.getRoomDetail(room.id);
  expect(detail).toHaveLength(1);
  expect(detail[0].messages).toHaveLength(1);
  expect(detail[0].messages[0]).toMatchObject({ body: "first", isMine: false });
  expect(detail[0].members).toHaveLength(2);
});

it("marks a message read for the sender once another member opens the room", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Read receipts", "");
  const sent = await actor.sendMessage(room.id, "did you see this?");
  const messageId = sent[0].id;

  // Before anyone else reads it, the sender sees it as unread.
  let detail = await actor.getRoomDetail(room.id);
  expect(detail[0].messages[0].isRead).toBe(false);

  actor.setIdentity(bob);
  await actor.registerUser("Bob");
  await actor.joinRoom(room.id);
  await actor.markRead(room.id, messageId);

  actor.setIdentity(alice);
  detail = await actor.getRoomDetail(room.id);
  expect(detail[0].messages[0].isRead).toBe(true);
});

it("reports presence and typing for other members of a room", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Presence", "");
  await actor.registerUser("Ada Lovelace");

  actor.setIdentity(bob);
  await actor.registerUser("Bob");
  await actor.joinRoom(room.id);
  await actor.heartbeat(room.id);
  await actor.setTyping(room.id, true);

  actor.setIdentity(alice);
  const detail = await actor.getRoomDetail(room.id);
  expect(detail[0].onlineUsers.map((u) => u.displayName)).toContain("Bob");
  expect(detail[0].typingUsers.map((u) => u.displayName)).toContain("Bob");

  // Clearing the typing flag removes the indicator.
  actor.setIdentity(bob);
  await actor.setTyping(room.id, false);
  actor.setIdentity(alice);
  const after = await actor.getRoomDetail(room.id);
  expect(after[0].typingUsers).toHaveLength(0);
});

it("leaves a room and stops being a member", async () => {
  actor.setIdentity(alice);
  const room = await actor.createRoom("Leavable", "");
  await actor.registerUser("Ada Lovelace");

  actor.setIdentity(bob);
  await actor.registerUser("Bob");
  await actor.joinRoom(room.id);
  await expect(actor.leaveRoom(room.id)).resolves.toBe(true);

  const rooms = await actor.listRooms();
  const summary = rooms.find((r) => r.id === room.id);
  expect(summary?.isMember).toBe(false);
  expect(summary?.memberCount).toBe(1n);
});

it("keeps one caller's profile out of another caller's view", async () => {
  actor.setIdentity(alice);
  await actor.registerUser("Ada Lovelace");

  actor.setIdentity(bob);
  const bobProfile = await actor.getMyProfile();
  expect(bobProfile).toHaveLength(1);
  expect(bobProfile[0].displayName).toBe("Bob");
});
