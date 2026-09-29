import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";
import Types "types/chat";
import ChatLib "lib/chat";
import ChatApiMixin "mixins/chat-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let users : Map.Map<Types.UserId, Types.User>;
  let rooms : Map.Map<Types.RoomId, Types.Room>;
  let members : Map.Map<ChatLib.MemberKey, Bool>;
  let messages : List.List<Types.Message>;
  let readStates : Map.Map<ChatLib.ReadKey, Types.ReadState>;
  let presence : Map.Map<ChatLib.PresenceKey, Types.Presence>;
  let typing : Map.Map<ChatLib.PresenceKey, Types.TypingState>;
  let nextRoomId : { var value : Nat };
  let nextMessageId : { var value : Nat };

  include MixinAuthorization(accessControlState, null);
  include ChatApiMixin(
    users,
    rooms,
    members,
    messages,
    readStates,
    presence,
    typing,
    nextRoomId,
    nextMessageId,
  );
  include ApiDocMixin();

  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      // Public chat catalogue: any caller, including anonymous, may read.
      users.toEntity("user", "User", "id")
        .sample({ id = samplePrincipal; displayName = ""; avatarInitial = ""; joinedAt = 0 })
        .public_()
        .build(),
      rooms.toEntity("room", "Room", "id")
        .sample({ id = 0; name = ""; description = ""; createdBy = samplePrincipal; createdAt = 0 })
        .public_()
        .build(),
      messages.toEntity("message", "Message", "id")
        .sample({ id = 0; roomId = 0; sender = samplePrincipal; senderName = ""; body = ""; sentAt = 0 })
        .public_()
        .build(),
      // Membership rows live in the map key, so promote the pair manually.
      OQL.Entity.manual<(ChatLib.MemberKey, Bool)>(
        "member",
        func () = members.entries(),
        "Member",
        "key",
      )
        .sample(((0, samplePrincipal), true))
        .payload("key", func ((roomId, userId), _) = roomId.toText() # ":" # userId.toText())
        .payload("roomId", func ((roomId, _), _) = roomId)
        .payload("userId", func ((_, userId), _) = userId)
        .edge("roomId", "room")
        .public_()
        .build(),
      // Per-user rows: each signed-in caller reads only their own.
      readStates.toEntity("readState", "ReadState", "userId")
        .sample({ userId = samplePrincipal; roomId = 0; lastReadMessageId = 0; updatedAt = 0 })
        .ownedBy("userId")
        .scopedPerUser()
        .build(),
      presence.toEntity("presence", "Presence", "userId")
        .sample({ userId = samplePrincipal; roomId = 0; lastSeenAt = 0 })
        .ownedBy("userId")
        .scopedPerUser()
        .build(),
      typing.toEntity("typing", "TypingState", "userId")
        .sample({ userId = samplePrincipal; roomId = 0; updatedAt = 0 })
        .ownedBy("userId")
        .scopedPerUser()
        .build(),
    ];
  });
};
