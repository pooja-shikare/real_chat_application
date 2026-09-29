/**
 * "X is typing…" indicator.
 *
 * Shows the names of members currently composing a message in the room. It
 * renders nothing when nobody is typing, so the thread stays uncluttered.
 */
import type { OnlineUser } from "@/types/chat";

interface TypingIndicatorProps {
  /** Members currently typing, as reported by the backend. */
  typingUsers: OnlineUser[];
}

/** Turn a list of names into a readable sentence. */
function describeTyping(users: OnlineUser[]): string {
  const names = users.map((user) => user.displayName);
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]} and ${names.length - 1} others are typing…`;
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <div
      data-ocid="room_view.typing_indicator"
      className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground"
      aria-live="polite"
    >
      {/* Three dots that pulse in sequence. */}
      <span className="flex items-center gap-0.5" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
      </span>
      <span>{describeTyping(typingUsers)}</span>
    </div>
  );
}
