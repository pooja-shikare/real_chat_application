/**
 * RoomCard — one room in the room list.
 *
 * Shows the room name, description, member count, and a preview of the last
 * message. The whole card is a link into the room; the join/leave button sits
 * on top and stops the click from also navigating.
 *
 * Beginner note: `onClick` on the button calls `event.stopPropagation()` so
 * clicking "Join" does not also open the room.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomSummary } from "@/types/chat";
import { Link } from "@tanstack/react-router";
import { Hash, LogIn, LogOut, Users } from "lucide-react";

interface RoomCardProps {
  /** The room to display. */
  room: RoomSummary;
  /** Position in the list, used for a stable test marker. */
  index: number;
  /** Called when the user joins this room. */
  onJoin: (roomId: RoomSummary["id"]) => void;
  /** Called when the user leaves this room. */
  onLeave: (roomId: RoomSummary["id"]) => void;
  /** True while a join/leave request for this room is in flight. */
  isPending: boolean;
}

export function RoomCard({
  room,
  index,
  onJoin,
  onLeave,
  isPending,
}: RoomCardProps) {
  // A room with no messages yet gets a friendly preview instead of a blank line.
  const preview = room.lastMessagePreview
    ? room.lastMessagePreview
    : "No messages yet — say hello!";

  return (
    <Link
      to="/room/$id"
      params={{ id: room.id.toString() }}
      data-ocid={`room_list.item.${index + 1}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        "transition-smooth hover:border-accent/60 hover:bg-secondary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent"
          >
            <Hash className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-foreground">
              {room.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {room.description || "No description provided."}
            </p>
          </div>
        </div>

        {room.isMember ? (
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full border border-accent/40 bg-accent/10 text-accent"
          >
            Joined
          </Badge>
        ) : null}
      </div>

      <p className="line-clamp-1 rounded-md bg-background/60 px-3 py-2 text-sm text-muted-foreground">
        {preview}
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {room.memberCount.toString()}{" "}
          {room.memberCount === 1n ? "member" : "members"}
        </span>

        {room.isMember ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            data-ocid={`room_list.leave_button.${index + 1}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onLeave(room.id);
            }}
            className="rounded-lg text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Leave
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            data-ocid={`room_list.join_button.${index + 1}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onJoin(room.id);
            }}
            className="rounded-lg"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Join
          </Button>
        )}
      </div>
    </Link>
  );
}
