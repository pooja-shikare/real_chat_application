import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type UserId = Principal;
  type RoomId = Nat;
  type MessageId = Nat;
  type Timestamp = Int;

  type User = {
    id : UserId;
    displayName : Text;
    avatarInitial : Text;
    joinedAt : Timestamp;
  };

  type Room = {
    id : RoomId;
    name : Text;
    description : Text;
    createdBy : UserId;
    createdAt : Timestamp;
  };

  type Message = {
    id : MessageId;
    roomId : RoomId;
    sender : UserId;
    senderName : Text;
    body : Text;
    sentAt : Timestamp;
  };

  type ReadState = {
    userId : UserId;
    roomId : RoomId;
    lastReadMessageId : MessageId;
    updatedAt : Timestamp;
  };

  type Presence = {
    userId : UserId;
    roomId : RoomId;
    lastSeenAt : Timestamp;
  };

  type TypingState = {
    userId : UserId;
    roomId : RoomId;
    updatedAt : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    users : Map.Map<UserId, User>;
    rooms : Map.Map<RoomId, Room>;
    members : Map.Map<(RoomId, UserId), Bool>;
    messages : List.List<Message>;
    readStates : Map.Map<(RoomId, UserId), ReadState>;
    presence : Map.Map<(RoomId, UserId), Presence>;
    typing : Map.Map<(RoomId, UserId), TypingState>;
    nextRoomId : { var value : Nat };
    nextMessageId : { var value : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      users = Map.empty();
      rooms = Map.empty();
      members = Map.empty();
      messages = List.empty();
      readStates = Map.empty();
      presence = Map.empty();
      typing = Map.empty();
      nextRoomId = { var value = 0 };
      nextMessageId = { var value = 0 };
    };
  };
};
