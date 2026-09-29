mixin () {
  public query func getApiDoc() : async Text {
          "# Chat Backend API"
      # "\n" #
      ""
      # "\n" #
      "A real-time chat backend for the internship project. It stores users, rooms,"
      # "\n" #
      "room memberships, messages, read states, presence heartbeats and typing"
      # "\n" #
      "signals, and exposes them over the Internet Computer through Candid."
      # "\n" #
      ""
      # "\n" #
      "## Authentication and identity"
      # "\n" #
      ""
      # "\n" #
      "Every method is callable by anyone, including anonymous callers, but the"
      # "\n" #
      "identity used is the **caller principal** (`msg_caller`). There is no password"
      # "\n" #
      "or session token: the frontend signs the user in with Internet Identity and"
      # "\n" #
      "every call carries that identity automatically."
      # "\n" #
      ""
      # "\n" #
      "- `registerUser(displayName)` creates (or replaces) the profile for the calling"
      # "\n" #
      "  principal and returns it. Call it once after sign-in, before using the chat."
      # "\n" #
      "- `getMyProfile()` returns the caller's stored profile, or `null` if the caller"
      # "\n" #
      "  has never registered."
      # "\n" #
      "- All other methods work with the caller principal as the acting user. A caller"
      # "\n" #
      "  that has not registered can still create rooms and send messages; their"
      # "\n" #
      "  `senderName` falls back to `Guest`."
      # "\n" #
      ""
      # "\n" #
      "The app's frontend pins an Internet Identity **derivation origin**, published at"
      # "\n" #
      "`/.well-known/ii-derivation-origin` when available. An agent that already holds"
      # "\n" #
      "the user's Internet Identity authorization derives the correct per-app"
      # "\n" #
      "principal against that origin (for example"
      # "\n" #
      "`icp identity link web <name> --app <host>`). Such a delegation acts with the"
      # "\n" #
      "user's full authority in this app until it expires. A principal derived against"
      # "\n" #
      "a different origin is a **different principal** than the one the frontend"
      # "\n" #
      "registered, so it will have its own profile and its own read state."
      # "\n" #
      ""
      # "\n" #
      "## Units and encodings"
      # "\n" #
      ""
      # "\n" #
      "- `Timestamp` is `Int`, in **nanoseconds** since the Unix epoch (IC system"
      # "\n" #
      "  time). `0` means unset."
      # "\n" #
      "- `UserId` is a `Principal`."
      # "\n" #
      "- `RoomId` and `MessageId` are `Nat`, allocated sequentially from `0`."
      # "\n" #
      "- `?Timestamp` is `null` when a room has no messages yet."
      # "\n" #
      "- `avatarInitial` is a single-character `Text` derived from the display name,"
      # "\n" #
      "  or `?` when the name is empty."
      # "\n" #
      ""
      # "\n" #
      "## Public methods"
      # "\n" #
      ""
      # "\n" #
      "### Profile"
      # "\n" #
      ""
      # "\n" #
      "- `registerUser(displayName : Text) : async User` — create or replace the"
      # "\n" #
      "  caller's profile. The name is trimmed; an empty name becomes `Guest`."
      # "\n" #
      "- `getMyProfile() : async ?User` — the caller's profile, or `null`."
      # "\n" #
      ""
      # "\n" #
      "### Rooms"
      # "\n" #
      ""
      # "\n" #
      "- `createRoom(name : Text, description : Text) : async Room` — create a room"
      # "\n" #
      "  and join the creator as its first member. Name and description are trimmed."
      # "\n" #
      "- `listRooms() : async [RoomSummary]` — every room with member count, last"
      # "\n" #
      "  message preview and whether the caller is a member. Sorted by most recent"
      # "\n" #
      "  message first, then by room id."
      # "\n" #
      "- `getRoomDetail(roomId : RoomId) : async ?RoomDetail` — room, members, online"
      # "\n" #
      "  users, typing users and the full message history (oldest first). `null` when"
      # "\n" #
      "  the room does not exist."
      # "\n" #
      "- `joinRoom(roomId : RoomId) : async Bool` — join a room; `false` if it does"
      # "\n" #
      "  not exist."
      # "\n" #
      "- `leaveRoom(roomId : RoomId) : async Bool` — leave a room; `true` if the"
      # "\n" #
      "  caller was a member."
      # "\n" #
      ""
      # "\n" #
      "### Messages"
      # "\n" #
      ""
      # "\n" #
      "- `sendMessage(roomId : RoomId, body : Text) : async ?Message` — send a"
      # "\n" #
      "  message. Returns `null` when the room does not exist or the caller is not a"
      # "\n" #
      "  member. The body is trimmed."
      # "\n" #
      "- `listMessages(roomId : RoomId) : async [Message]` — raw stored messages for a"
      # "\n" #
      "  room, in insertion order."
      # "\n" #
      ""
      # "\n" #
      "### Presence, typing and read state"
      # "\n" #
      ""
      # "\n" #
      "- `heartbeat(roomId : RoomId) : async ()` — mark the caller as active in a"
      # "\n" #
      "  room. A user counts as online for **30 seconds** after their last heartbeat."
      # "\n" #
      "- `setTyping(roomId : RoomId, isTyping : Bool) : async ()` — set or clear the"
      # "\n" #
      "  caller's typing signal. A typing signal stays visible for **6 seconds** after"
      # "\n" #
      "  it was set."
      # "\n" #
      "- `markRead(roomId : RoomId, lastReadMessageId : MessageId) : async ()` — mark"
      # "\n" #
      "  every message up to `lastReadMessageId` as read for the caller."
      # "\n" #
      ""
      # "\n" #
      "## Lifecycle and polling"
      # "\n" #
      ""
      # "\n" #
      "There is no server push. The frontend keeps the view current by polling:"
      # "\n" #
      ""
      # "\n" #
      "- Call `heartbeat(roomId)` every ~10 seconds while a room is open, so the"
      # "\n" #
      "  caller stays in the online list."
      # "\n" #
      "- Call `getRoomDetail(roomId)` on an interval (for example every 2 seconds) to"
      # "\n" #
      "  pick up new messages, presence and typing changes."
      # "\n" #
      "- Call `setTyping(roomId, true)` while composing and `setTyping(roomId, false)`"
      # "\n" #
      "  after sending or after a short idle delay."
      # "\n" #
      "- Call `markRead(roomId, latestMessageId)` when the room is opened or a new"
      # "\n" #
      "  message arrives, so read receipts update."
      # "\n" #
      ""
      # "\n" #
      "## Mutation retry safety"
      # "\n" #
      ""
      # "\n" #
      "- `registerUser`, `createRoom`, `sendMessage`, `heartbeat`, `setTyping` and"
      # "\n" #
      "  `markRead` are **not idempotent**: retrying them creates a second room, a"
      # "\n" #
      "  second message, or a newer timestamp. Do not blindly retry after a timeout."
      # "\n" #
      "- `joinRoom` and `leaveRoom` are idempotent in effect: joining twice leaves the"
      # "\n" #
      "  caller a member, leaving twice leaves them out."
      # "\n" #
      "- `markRead` is safe to repeat with the same `lastReadMessageId`; it only moves"
      # "\n" #
      "  the read marker forward when a larger id is supplied."
      # "\n" #
      ""
      # "\n" #
      "## Errors and gotchas"
      # "\n" #
      ""
      # "\n" #
      "- `sendMessage` returns `null` (it does not trap) for a missing room or a"
      # "\n" #
      "  non-member caller; the frontend should surface a friendly message."
      # "\n" #
      "- `getRoomDetail` returns `null` for a missing room."
      # "\n" #
      "- `listMessages` returns raw records without `isMine` / `isRead`; use"
      # "\n" #
      "  `getRoomDetail` for the view the UI renders."
      # "\n" #
      "- Read state is per `(room, user)` pair and is only updated by `markRead`."
      # "\n" #
      "- Presence and typing entries are never deleted; they simply expire out of the"
      # "\n" #
      "  online/typing lists once their window passes."
      # "\n" #
      "- Message ids are global and monotonic, so `lastReadMessageId` comparisons are"
      # "\n" #
      "  valid across rooms only within the same room's history."
  };
};
