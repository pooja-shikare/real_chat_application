/**
 * Online members panel for a room.
 *
 * Lists everyone currently active in the room with a green presence dot.
 * On small screens the list collapses into a compact horizontal strip so it
 * does not take over the conversation.
 */
import type { OnlineUser } from "@/types/chat";
import { Users } from "lucide-react";

interface OnlineUsersListProps {
  /** Members currently active in the room. */
  onlineUsers: OnlineUser[];
  /** Total members in the room, shown in the heading. */
  memberCount: number;
}

export function OnlineUsersList({
  onlineUsers,
  memberCount,
}: OnlineUsersListProps) {
  return (
    <section
      data-ocid="room_view.online_users"
      aria-label="Online members"
      className="border-b border-border bg-card/60 px-4 py-3 lg:border-b-0 lg:border-l lg:px-4 lg:py-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" aria-hidden="true" />
        <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Online — {onlineUsers.length}
        </h2>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      </div>

      {onlineUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No one else is here right now.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1">
          {onlineUsers.map((user) => (
            <li
              key={user.userId.toString()}
              data-ocid="room_view.online_user_item"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 lg:bg-secondary/40"
            >
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xs font-semibold text-secondary-foreground">
                {user.avatarInitial}
                {/* Green presence dot. */}
                <span
                  aria-hidden="true"
                  className="presence-ring absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success"
                />
              </span>
              <span className="max-w-[8rem] truncate text-sm text-foreground">
                {user.displayName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
