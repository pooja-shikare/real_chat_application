/**
 * Room view page — `/room/:id`.
 *
 * The full conversation UI:
 *   - a sticky room header (name, description, member count)
 *   - a scrollable message thread grouped by day
 *   - an online-members list (collapses on mobile)
 *   - a typing indicator
 *   - a fixed bottom composer
 *
 * "Real-time" updates come from polling: `useRoomDetail` refetches every few
 * seconds, so new messages and presence changes appear without a reload.
 */
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { OnlineUsersList } from "@/components/OnlineUsersList";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeartbeat, useMarkRead, useRoomDetail } from "@/hooks/useChat";
import type { MessageDayGroup, MessageView, RoomId } from "@/types/chat";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquareDashed } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

/** How often to send a presence heartbeat while the room is open. */
const HEARTBEAT_MS = 10_000;

/** Convert a backend nanosecond timestamp into a `Date`, or `null` if invalid. */
function toDate(sentAt: bigint): Date | null {
  const date = new Date(Number(sentAt / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A stable key for the calendar day a message belongs to, e.g. "2026-09-29". */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** A friendly label for a day: "Today", "Yesterday", or "Sep 29, 2026". */
function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Group messages into day buckets, preserving chronological order. */
function groupByDay(messages: MessageView[]): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];

  for (const message of messages) {
    const date = toDate(message.sentAt);
    const key = date ? dayKey(date) : "unknown";
    const label = date ? dayLabel(date) : "Earlier";

    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.messages.push(message);
    } else {
      groups.push({ key, label, messages: [message] });
    }
  }

  return groups;
}

export function RoomViewPage() {
  // The route param arrives as a string; the backend expects a bigint.
  const params = useParams({ strict: false }) as { id?: string };
  const roomId: RoomId | null = params.id ? BigInt(params.id) : null;

  const detail = useRoomDetail(roomId);
  const markRead = useMarkRead(roomId ?? 0n);
  const heartbeat = useHeartbeat(roomId ?? 0n);

  const room = detail.data?.room ?? null;
  const messages = detail.data?.messages ?? [];
  const onlineUsers = detail.data?.onlineUsers ?? [];
  const typingUsers = detail.data?.typingUsers ?? [];
  const memberCount = detail.data?.members.length ?? 0;

  const groups = useMemo(() => groupByDay(messages), [messages]);

  // The id of the newest message, used to trigger read receipts and scrolling.
  const lastMessageId =
    messages.length > 0 ? messages[messages.length - 1].id : null;

  // --- Presence heartbeat: keep this user "online" while the room is open. ---
  const heartbeatRef = useRef(heartbeat.mutate);
  heartbeatRef.current = heartbeat.mutate;

  useEffect(() => {
    if (roomId === null) return;
    heartbeatRef.current();
    const timer = setInterval(() => heartbeatRef.current(), HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [roomId]);

  // --- Read receipts: mark the room read when it opens and when new messages
  //     arrive. `markReadRef` keeps the effect from re-running on every render.
  const markReadRef = useRef(markRead.mutate);
  markReadRef.current = markRead.mutate;

  useEffect(() => {
    if (lastMessageId === null) return;
    markReadRef.current(lastMessageId);
  }, [lastMessageId]);

  // --- Auto-scroll: jump to the newest message whenever the thread grows. ---
  // The effect body only reads the ref, but it must re-run when the newest
  // message changes, so `lastMessageId` is a deliberate dependency.
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  // --- Missing room: the backend returned `null` for this id. ---
  if (roomId === null || (!detail.isLoading && detail.data === null)) {
    return (
      <div
        data-ocid="room_view.error_state"
        className="flex h-full flex-col items-center justify-center gap-4 bg-background px-6 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <MessageSquareDashed className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Room not found
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This room may have been removed, or the link is incorrect.
          </p>
        </div>
        <Button asChild type="button" className="rounded-xl">
          <Link to="/" data-ocid="room_view.back_button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to rooms
          </Link>
        </Button>
      </div>
    );
  }

  // --- Loading: show a layout-matched skeleton on first load. ---
  if (detail.isLoading || !room) {
    return (
      <div
        data-ocid="room_view.loading_state"
        className="flex h-full flex-col bg-background"
      >
        <div className="border-b border-border bg-card px-4 py-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-12 w-2/3 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="room_view.page"
      className="flex h-full flex-col bg-background"
    >
      {/* Sticky room header. */}
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Link
              to="/"
              aria-label="Back to rooms"
              data-ocid="room_view.back_button"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold text-foreground">
              {room.name}
            </h1>
            {room.description ? (
              <p className="truncate text-xs text-muted-foreground">
                {room.description}
              </p>
            ) : null}
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-secondary px-3 py-1 font-mono text-[11px] text-secondary-foreground">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </header>

      {/* Body: thread + online members. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="surface-grid min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            {groups.length === 0 ? (
              <div
                data-ocid="room_view.empty_state"
                className="flex h-full flex-col items-center justify-center gap-3 text-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <MessageSquareDashed className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">
                    No messages yet
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Be the first to say hello in {room.name}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => (
                  <section key={group.key} className="space-y-3">
                    {/* Day separator pill. */}
                    <div className="flex items-center justify-center">
                      <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </span>
                    </div>
                    {group.messages.map((message) => (
                      <MessageBubble
                        key={message.id.toString()}
                        message={message}
                      />
                    ))}
                  </section>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Typing indicator sits just above the composer. */}
          <div className="px-4 md:px-6">
            <TypingIndicator typingUsers={typingUsers} />
          </div>

          <MessageComposer roomId={roomId} />
        </div>

        <OnlineUsersList onlineUsers={onlineUsers} memberCount={memberCount} />
      </div>
    </div>
  );
}
