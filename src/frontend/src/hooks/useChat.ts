/**
 * Shared data hooks for the chat app.
 *
 * All backend access goes through React Query here. Components and pages just
 * call these hooks and render the result — they never touch the actor directly.
 *
 * "Real-time" in this app is implemented with polling: queries that should stay
 * fresh use `refetchInterval`, so new messages and presence changes appear
 * without a page reload.
 */
import { createActor } from "@/backend";
import type { MessageId, RoomId } from "@/backend";
import * as chat from "@/lib/chat";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** How often the room list refreshes, in milliseconds. */
const ROOM_LIST_POLL_MS = 5000;
/** How often an open room refreshes (messages, presence, typing), in ms. */
const ROOM_DETAIL_POLL_MS = 3000;

/** Query keys in one place so invalidation stays consistent. */
export const chatKeys = {
  profile: ["chat", "profile"] as const,
  rooms: ["chat", "rooms"] as const,
  roomDetail: (roomId: RoomId) => ["chat", "room", roomId.toString()] as const,
};

/** The signed-in user's profile, or `null` when they have not registered yet. */
export function useMyProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: chatKeys.profile,
    queryFn: async () => {
      if (!actor) return null;
      return chat.getMyProfile(actor);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Register the signed-in user's display name. */
export function useRegisterUser() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return chat.registerUser(actor, displayName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.profile });
    },
  });
}

/** Every room, refreshed on an interval so previews and counts stay current. */
export function useRooms() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: chatKeys.rooms,
    queryFn: async () => {
      if (!actor) return [];
      return chat.listRooms(actor);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: ROOM_LIST_POLL_MS,
  });
}

/** Create a room; the creator becomes its first member. */
export function useCreateRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return chat.createRoom(actor, input.name, input.description);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    },
  });
}

/** Join a room. */
export function useJoinRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error("Backend is not ready");
      return chat.joinRoom(actor, roomId);
    },
    onSuccess: (_result, roomId) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.roomDetail(roomId),
      });
    },
  });
}

/** Leave a room. */
export function useLeaveRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: RoomId) => {
      if (!actor) throw new Error("Backend is not ready");
      return chat.leaveRoom(actor, roomId);
    },
    onSuccess: (_result, roomId) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.roomDetail(roomId),
      });
    },
  });
}

/**
 * A single room's full detail. Polls on an interval so new messages, presence,
 * and typing state arrive without a manual refresh.
 */
export function useRoomDetail(roomId: RoomId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: chatKeys.roomDetail(roomId ?? 0n),
    queryFn: async () => {
      if (!actor || roomId === null) return null;
      return chat.getRoomDetail(actor, roomId);
    },
    enabled: !!actor && !isFetching && roomId !== null,
    refetchInterval: ROOM_DETAIL_POLL_MS,
  });
}

/** Send a message to a room. */
export function useSendMessage(roomId: RoomId) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return chat.sendMessage(actor, roomId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.roomDetail(roomId),
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms });
    },
  });
}

/** Mark a room's messages as read up to the given message. */
export function useMarkRead(roomId: RoomId) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lastReadMessageId: MessageId) => {
      if (!actor) throw new Error("Backend is not ready");
      return chat.markRead(actor, roomId, lastReadMessageId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.roomDetail(roomId),
      });
    },
  });
}

/** Tell the backend whether the caller is typing. Fire-and-forget. */
export function useSetTyping(roomId: RoomId) {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (isTyping: boolean) => {
      if (!actor) return;
      return chat.setTyping(actor, roomId, isTyping);
    },
  });
}

/** Send a presence heartbeat for a room. Fire-and-forget. */
export function useHeartbeat(roomId: RoomId) {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      return chat.heartbeat(actor, roomId);
    },
  });
}
