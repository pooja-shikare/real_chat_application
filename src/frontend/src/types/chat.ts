/**
 * Shared frontend types for the chat app.
 *
 * These mirror the backend "view" types generated in `src/backend.d.ts`.
 * We re-export them here so pages and components can import from one place
 * (`@/types/chat`) instead of reaching into the generated bindings directly.
 *
 * NOTE: `UserRole` is a real runtime value (an enum), so it is re-exported as a
 * value — not with `export type` — otherwise `UserRole.admin` would fail.
 */
import type {
  Message,
  MessageId,
  MessageView,
  OnlineUser,
  Room,
  RoomDetail,
  RoomId,
  RoomSummary,
  Timestamp,
  User,
  UserId,
} from "@/backend";
import { UserRole } from "@/backend";

export type {
  Message,
  MessageId,
  MessageView,
  OnlineUser,
  Room,
  RoomDetail,
  RoomId,
  RoomSummary,
  Timestamp,
  User,
  UserId,
};
export { UserRole };

/** A single message grouped under a calendar day, used by the thread view. */
export interface MessageDayGroup {
  /** Stable key for the day, e.g. "2026-09-29". */
  key: string;
  /** Human label, e.g. "Today", "Yesterday", or "Sep 29, 2026". */
  label: string;
  messages: MessageView[];
}
