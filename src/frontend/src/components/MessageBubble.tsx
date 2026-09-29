/**
 * A single chat message bubble.
 *
 * The current user's own messages are coral and right-aligned; everyone
 * else's are teal and left-aligned. Each bubble shows the sender's name and
 * the time it was sent, and the current user's messages also show whether
 * other members have read them yet.
 */
import type { MessageView } from "@/types/chat";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: MessageView;
}

/** Format a backend nanosecond timestamp as a short local time, e.g. "14:05". */
function formatTime(sentAt: bigint): string {
  const date = new Date(Number(sentAt / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMine = message.isMine;

  return (
    <div
      data-ocid="room_view.message_item"
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}
      >
        {/* Sender name — only shown for other people's messages. */}
        {!isMine ? (
          <span className="mb-1 px-1 font-display text-xs font-semibold text-accent">
            {message.senderName}
          </span>
        ) : null}

        <div
          className={
            isMine
              ? "bubble-own bg-primary px-4 py-2.5 text-primary-foreground shadow-sm"
              : "bubble-other border border-border bg-card px-4 py-2.5 text-card-foreground shadow-sm"
          }
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.body}
          </p>
        </div>

        {/* Timestamp, plus a read receipt on the current user's messages. */}
        <div
          className={`mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground ${
            isMine ? "flex-row-reverse" : ""
          }`}
        >
          <span className="font-mono">{formatTime(message.sentAt)}</span>
          {isMine ? (
            <span
              data-ocid="room_view.read_state"
              className="flex items-center gap-1"
              title={message.isRead ? "Read by others" : "Sent"}
            >
              {message.isRead ? (
                <>
                  <CheckCheck
                    className="h-3.5 w-3.5 text-accent"
                    aria-hidden="true"
                  />
                  <span className="text-accent">Read</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sent</span>
                </>
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
