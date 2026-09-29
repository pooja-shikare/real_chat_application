import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Types "../types/chat";

module {
  public type UserId = Types.UserId;
  public type RoomId = Types.RoomId;
  public type MessageId = Types.MessageId;
  public type Timestamp = Types.Timestamp;

  // A member is identified by the (room, user) pair.
  public type MemberKey = (RoomId, UserId);

  // Presence and typing are keyed by the same pair.
  public type PresenceKey = (RoomId, UserId);

  // Read state is keyed by the same pair.
  public type ReadKey = (RoomId, UserId);

  // Comparison for the (room, user) tuple keys used by the maps above.
  public func compare(a : (RoomId, UserId), b : (RoomId, UserId)) : Order.Order {
    switch (Nat.compare(a.0, b.0)) {
      case (#equal) { Principal.compare(a.1, b.1) };
      case (order) { order };
    };
  };

  // How long a user counts as "online" after their last heartbeat.
  let presenceWindowNs : Int = 30_000_000_000;

  // How long a typing signal stays visible after it was set.
  let typingWindowNs : Int = 6_000_000_000;

  func firstChar(name : Text) : Text {
    let trimmed = name.trim(#predicate(func c = c == ' '));
    if (trimmed.size() == 0) { "?" } else {
      switch (trimmed.toIter().next()) {
        case (?c) { c.toText() };
        case null { "?" };
      };
    };
  };

  public func registerUser(
    users : Map.Map<UserId, Types.User>,
    caller : UserId,
    displayName : Text,
    now : Timestamp,
  ) : Types.User {
    let name = displayName.trim(#predicate(func c = c == ' '));
    let finalName = if (name.size() == 0) { "Guest" } else { name };
    let user : Types.User = {
      id = caller;
      displayName = finalName;
      avatarInitial = firstChar(finalName);
      joinedAt = now;
    };
    users.add(caller, user);
    user;
  };

  public func getProfile(
    users : Map.Map<UserId, Types.User>,
    caller : UserId,
  ) : ?Types.User {
    users.get(caller);
  };

  public func createRoom(
    rooms : Map.Map<RoomId, Types.Room>,
    members : Map.Map<MemberKey, Bool>,
    nextRoomId : { var value : Nat },
    caller : UserId,
    name : Text,
    description : Text,
    now : Timestamp,
  ) : Types.Room {
    let id = nextRoomId.value;
    nextRoomId.value := id + 1;
    let room : Types.Room = {
      id;
      name = name.trim(#predicate(func c = c == ' '));
      description = description.trim(#predicate(func c = c == ' '));
      createdBy = caller;
      createdAt = now;
    };
    rooms.add(id, room);
    members.add((id, caller), true);
    room;
  };

  public func listRooms(
    rooms : Map.Map<RoomId, Types.Room>,
    members : Map.Map<MemberKey, Bool>,
    messages : List.List<Types.Message>,
    caller : UserId,
  ) : [Types.RoomSummary] {
    let summaries = rooms.values().map(
      func(room) {
        var memberCount = 0;
        for ((key, _) in members.entries()) {
          if (key.0 == room.id) { memberCount += 1 };
        };
        var lastPreview = "";
        var lastAt : ?Timestamp = null;
        for (message in messages.values()) {
          if (message.roomId == room.id) {
            switch (lastAt) {
              case null {
                lastPreview := message.body;
                lastAt := ?message.sentAt;
              };
              case (?t) {
                if (message.sentAt >= t) {
                  lastPreview := message.body;
                  lastAt := ?message.sentAt;
                };
              };
            };
          };
        };
        {
          id = room.id;
          name = room.name;
          description = room.description;
          memberCount;
          lastMessagePreview = lastPreview;
          lastMessageAt = lastAt;
          isMember = members.get((room.id, caller)) != null;
        };
      }
    ).toArray();
    summaries.sort(
      func(a, b) {
        switch (a.lastMessageAt, b.lastMessageAt) {
          case (?x, ?y) { Int.compare(y, x) };
          case (?_, null) { #less };
          case (null, ?_) { #greater };
          case (null, null) { Nat.compare(a.id, b.id) };
        };
      }
    );
  };

  public func getRoomDetail(
    rooms : Map.Map<RoomId, Types.Room>,
    members : Map.Map<MemberKey, Bool>,
    messages : List.List<Types.Message>,
    users : Map.Map<UserId, Types.User>,
    readStates : Map.Map<ReadKey, Types.ReadState>,
    presence : Map.Map<PresenceKey, Types.Presence>,
    typing : Map.Map<PresenceKey, Types.TypingState>,
    caller : UserId,
    roomId : RoomId,
    now : Timestamp,
  ) : ?Types.RoomDetail {
    switch (rooms.get(roomId)) {
      case null { null };
      case (?room) {
        let memberList = List.empty<Types.User>();
        for ((key, _) in members.entries()) {
          if (key.0 == roomId) {
            switch (users.get(key.1)) {
              case (?user) { memberList.add(user) };
              case null {};
            };
          };
        };
        let onlineList = List.empty<Types.OnlineUser>();
        let typingList = List.empty<Types.OnlineUser>();
        for ((key, state) in presence.entries()) {
          if (key.0 == roomId and now - state.lastSeenAt <= presenceWindowNs) {
            switch (users.get(key.1)) {
              case (?user) {
                onlineList.add({
                  userId = user.id;
                  displayName = user.displayName;
                  avatarInitial = user.avatarInitial;
                });
              };
              case null {};
            };
          };
        };
        for ((key, state) in typing.entries()) {
          if (key.0 == roomId and key.1 != caller and now - state.updatedAt <= typingWindowNs) {
            switch (users.get(key.1)) {
              case (?user) {
                typingList.add({
                  userId = user.id;
                  displayName = user.displayName;
                  avatarInitial = user.avatarInitial;
                });
              };
              case null {};
            };
          };
        };
        // A message counts as read when at least one OTHER room member has
        // advanced their read marker to (or past) that message.
        func isReadByOther(message : Types.Message) : Bool {
          var read = false;
          for ((key, state) in readStates.entries()) {
            if (key.0 == roomId and key.1 != message.sender and state.lastReadMessageId >= message.id) {
              read := true;
            };
          };
          read;
        };
        let views = List.empty<Types.MessageView>();
        for (message in messages.values()) {
          if (message.roomId == roomId) {
            views.add({
              id = message.id;
              roomId = message.roomId;
              sender = message.sender;
              senderName = message.senderName;
              body = message.body;
              sentAt = message.sentAt;
              isMine = message.sender == caller;
              isRead = isReadByOther(message);
            });
          };
        };
        let sorted = views.toArray().sort(
          func(a, b) {
            if (a.sentAt < b.sentAt) { #less }
            else if (a.sentAt > b.sentAt) { #greater }
            else { Nat.compare(a.id, b.id) };
          }
        );
        ?{
          room;
          members = memberList.toArray();
          onlineUsers = onlineList.toArray();
          typingUsers = typingList.toArray();
          messages = sorted;
        };
      };
    };
  };

  public func joinRoom(
    rooms : Map.Map<RoomId, Types.Room>,
    members : Map.Map<MemberKey, Bool>,
    caller : UserId,
    roomId : RoomId,
  ) : Bool {
    switch (rooms.get(roomId)) {
      case null { false };
      case (?_) {
        members.add((roomId, caller), true);
        true;
      };
    };
  };

  public func leaveRoom(
    members : Map.Map<MemberKey, Bool>,
    caller : UserId,
    roomId : RoomId,
  ) : Bool {
    let existed = members.get((roomId, caller)) != null;
    members.remove((roomId, caller));
    existed;
  };

  public func sendMessage(
    rooms : Map.Map<RoomId, Types.Room>,
    members : Map.Map<MemberKey, Bool>,
    messages : List.List<Types.Message>,
    users : Map.Map<UserId, Types.User>,
    nextMessageId : { var value : Nat },
    caller : UserId,
    roomId : RoomId,
    body : Text,
    now : Timestamp,
  ) : ?Types.Message {
    switch (rooms.get(roomId)) {
      case null { null };
      case (?_) {
        if (members.get((roomId, caller)) == null) { return null };
        let senderName = switch (users.get(caller)) {
          case (?user) { user.displayName };
          case null { "Guest" };
        };
        let id = nextMessageId.value;
        nextMessageId.value := id + 1;
        let message : Types.Message = {
          id;
          roomId;
          sender = caller;
          senderName;
          body = body.trim(#predicate(func c = c == ' '));
          sentAt = now;
        };
        messages.add(message);
        ?message;
      };
    };
  };

  public func listMessages(
    messages : List.List<Types.Message>,
    caller : UserId,
    roomId : RoomId,
  ) : [Types.Message] {
    ignore caller;
    messages.toArray().filter(func(message) = message.roomId == roomId);
  };

  public func heartbeat(
    presence : Map.Map<PresenceKey, Types.Presence>,
    caller : UserId,
    roomId : RoomId,
    now : Timestamp,
  ) : () {
    presence.add((roomId, caller), { userId = caller; roomId; lastSeenAt = now });
  };

  public func setTyping(
    typing : Map.Map<PresenceKey, Types.TypingState>,
    caller : UserId,
    roomId : RoomId,
    isTyping : Bool,
    now : Timestamp,
  ) : () {
    if (isTyping) {
      typing.add((roomId, caller), { userId = caller; roomId; updatedAt = now });
    } else {
      typing.remove((roomId, caller));
    };
  };

  public func markRead(
    readStates : Map.Map<ReadKey, Types.ReadState>,
    caller : UserId,
    roomId : RoomId,
    lastReadMessageId : MessageId,
    now : Timestamp,
  ) : () {
    readStates.add((roomId, caller), {
      userId = caller;
      roomId;
      lastReadMessageId;
      updatedAt = now;
    });
  };
};
