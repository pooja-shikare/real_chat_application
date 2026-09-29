import Common "common";

module {
  public type UserId = Common.UserId;
  public type RoomId = Common.RoomId;
  public type MessageId = Common.MessageId;
  public type Timestamp = Common.Timestamp;

  // Internal stored records
  public type User = {
    id : UserId;
    displayName : Text;
    avatarInitial : Text;
    joinedAt : Timestamp;
  };

  public type Room = {
    id : RoomId;
    name : Text;
    description : Text;
    createdBy : UserId;
    createdAt : Timestamp;
  };

  public type Message = {
    id : MessageId;
    roomId : RoomId;
    sender : UserId;
    senderName : Text;
    body : Text;
    sentAt : Timestamp;
  };

  public type ReadState = {
    userId : UserId;
    roomId : RoomId;
    lastReadMessageId : MessageId;
    updatedAt : Timestamp;
  };

  public type Presence = {
    userId : UserId;
    roomId : RoomId;
    lastSeenAt : Timestamp;
  };

  public type TypingState = {
    userId : UserId;
    roomId : RoomId;
    updatedAt : Timestamp;
  };

  // Shared view types returned across the API boundary
  public type RoomSummary = {
    id : RoomId;
    name : Text;
    description : Text;
    memberCount : Nat;
    lastMessagePreview : Text;
    lastMessageAt : ?Timestamp;
    isMember : Bool;
  };

  public type MessageView = {
    id : MessageId;
    roomId : RoomId;
    sender : UserId;
    senderName : Text;
    body : Text;
    sentAt : Timestamp;
    isMine : Bool;
    isRead : Bool;
  };

  public type OnlineUser = {
    userId : UserId;
    displayName : Text;
    avatarInitial : Text;
  };

  public type RoomDetail = {
    room : Room;
    members : [User];
    onlineUsers : [OnlineUser];
    typingUsers : [OnlineUser];
    messages : [MessageView];
  };

  public type ChatError = {
    #notRegistered;
    #roomNotFound : RoomId;
    #notAMember : RoomId;
    #emptyName;
    #emptyMessage;
  };
};
