import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/chat";
import ChatLib "../lib/chat";

mixin (
  users : Map.Map<Types.UserId, Types.User>,
  rooms : Map.Map<Types.RoomId, Types.Room>,
  members : Map.Map<ChatLib.MemberKey, Bool>,
  messages : List.List<Types.Message>,
  readStates : Map.Map<ChatLib.ReadKey, Types.ReadState>,
  presence : Map.Map<ChatLib.PresenceKey, Types.Presence>,
  typing : Map.Map<ChatLib.PresenceKey, Types.TypingState>,
  nextRoomId : { var value : Nat },
  nextMessageId : { var value : Nat },
) {
  public shared ({ caller }) func registerUser(displayName : Text) : async Types.User {
    ChatLib.registerUser(users, caller, displayName, Time.now());
  };

  public query ({ caller }) func getMyProfile() : async ?Types.User {
    ChatLib.getProfile(users, caller);
  };

  public shared ({ caller }) func createRoom(name : Text, description : Text) : async Types.Room {
    ChatLib.createRoom(rooms, members, nextRoomId, caller, name, description, Time.now());
  };

  public query ({ caller }) func listRooms() : async [Types.RoomSummary] {
    ChatLib.listRooms(rooms, members, messages, caller);
  };

  public query ({ caller }) func getRoomDetail(roomId : Types.RoomId) : async ?Types.RoomDetail {
    ChatLib.getRoomDetail(rooms, members, messages, users, readStates, presence, typing, caller, roomId, Time.now());
  };

  public shared ({ caller }) func joinRoom(roomId : Types.RoomId) : async Bool {
    ChatLib.joinRoom(rooms, members, caller, roomId);
  };

  public shared ({ caller }) func leaveRoom(roomId : Types.RoomId) : async Bool {
    ChatLib.leaveRoom(members, caller, roomId);
  };

  public shared ({ caller }) func sendMessage(roomId : Types.RoomId, body : Text) : async ?Types.Message {
    ChatLib.sendMessage(rooms, members, messages, users, nextMessageId, caller, roomId, body, Time.now());
  };

  public query ({ caller }) func listMessages(roomId : Types.RoomId) : async [Types.Message] {
    ChatLib.listMessages(messages, caller, roomId);
  };

  public shared ({ caller }) func heartbeat(roomId : Types.RoomId) : async () {
    ChatLib.heartbeat(presence, caller, roomId, Time.now());
  };

  public shared ({ caller }) func setTyping(roomId : Types.RoomId, isTyping : Bool) : async () {
    ChatLib.setTyping(typing, caller, roomId, isTyping, Time.now());
  };

  public shared ({ caller }) func markRead(roomId : Types.RoomId, lastReadMessageId : Types.MessageId) : async () {
    ChatLib.markRead(readStates, caller, roomId, lastReadMessageId, Time.now());
  };
};
