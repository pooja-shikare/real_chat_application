/**
 * RoomListPage — the default route.
 *
 * Two sections:
 *   - "My Rooms": rooms the signed-in user has already joined.
 *   - "Discover": every other room they can join.
 *
 * The page is responsive: one column on mobile, a comfortable grid on desktop.
 * Data comes from the shared hooks in `hooks/useChat.ts`; this file only
 * renders and wires up the join/leave/create actions.
 */
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useJoinRoom,
  useLeaveRoom,
  useMyProfile,
  useRooms,
} from "@/hooks/useChat";
import type { RoomId, RoomSummary } from "@/types/chat";
import { Hash, Plus, Users } from "lucide-react";
import { useState } from "react";

/** A short, friendly greeting based on the time of day. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Loading placeholders that match the room card layout. */
function RoomGridSkeleton() {
  const ids = Array.from({ length: 4 }, (_, i) => `room-skeleton-${i}`);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ids.map((id) => (
        <div
          key={id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

/** A friendly empty state with a clear next step. */
function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-ocid="room_list.empty_state"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-accent"
      >
        <Hash className="h-6 w-6" />
      </span>
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

/** One labelled section of the page. */
function RoomSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

export function RoomListPage() {
  const profile = useMyProfile();
  const rooms = useRooms();
  const joinRoom = useJoinRoom();
  const leaveRoom = useLeaveRoom();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Split the rooms into "joined" and "discover" groups.
  const allRooms: RoomSummary[] = rooms.data ?? [];
  const myRooms = allRooms.filter((room) => room.isMember);
  const discoverRooms = allRooms.filter((room) => !room.isMember);

  // Track which room is mid-request so only its button shows as busy.
  const [pendingRoomId, setPendingRoomId] = useState<RoomId | null>(null);

  function handleJoin(roomId: RoomId) {
    setPendingRoomId(roomId);
    joinRoom.mutate(roomId, {
      onSettled: () => setPendingRoomId(null),
    });
  }

  function handleLeave(roomId: RoomId) {
    setPendingRoomId(roomId);
    leaveRoom.mutate(roomId, {
      onSettled: () => setPendingRoomId(null),
    });
  }

  const isLoading = rooms.isLoading;
  const hasNoRooms = !isLoading && allRooms.length === 0;

  return (
    <div
      data-ocid="room_list.page"
      className="h-full overflow-y-auto bg-background"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        {/* Page header: greeting + the single primary action */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {greeting()}
              {profile.data ? `, ${profile.data.displayName}` : ""}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Rooms
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join a conversation or start a new one.
            </p>
          </div>

          <Button
            type="button"
            data-ocid="room_list.create_room_button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New room
          </Button>
        </header>

        {rooms.isError ? (
          <div
            data-ocid="room_list.error_state"
            className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
          >
            <p className="text-sm text-foreground">
              We could not load the rooms. Check your connection and try again.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-ocid="room_list.retry_button"
              onClick={() => void rooms.refetch()}
              className="rounded-lg"
            >
              Try again
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <div data-ocid="room_list.loading_state">
            <RoomGridSkeleton />
          </div>
        ) : null}

        {hasNoRooms ? (
          <EmptyState
            title="No rooms yet"
            message="Be the first to start a conversation. Create a room and invite others to join."
            action={
              <Button
                type="button"
                data-ocid="room_list.empty_create_button"
                onClick={() => setIsCreateOpen(true)}
                className="rounded-lg"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create the first room
              </Button>
            }
          />
        ) : null}

        {!isLoading && !hasNoRooms ? (
          <>
            <RoomSection title="My Rooms" count={myRooms.length}>
              {myRooms.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {myRooms.map((room, index) => (
                    <RoomCard
                      key={room.id.toString()}
                      room={room}
                      index={index}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      isPending={pendingRoomId === room.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="You have not joined any rooms"
                  message="Pick a room from Discover below to start chatting."
                />
              )}
            </RoomSection>

            <RoomSection title="Discover" count={discoverRooms.length}>
              {discoverRooms.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {discoverRooms.map((room, index) => (
                    <RoomCard
                      key={room.id.toString()}
                      room={room}
                      index={index}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      isPending={pendingRoomId === room.id}
                    />
                  ))}
                </div>
              ) : (
                <div
                  data-ocid="room_list.discover_empty_state"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-6 text-sm text-muted-foreground"
                >
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  You have joined every room. Create a new one to keep the
                  conversation going.
                </div>
              )}
            </RoomSection>
          </>
        ) : null}
      </div>

      <CreateRoomDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
