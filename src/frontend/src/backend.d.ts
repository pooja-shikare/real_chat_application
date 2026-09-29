import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Message {
    id: MessageId;
    body: string;
    sender: UserId;
    sentAt: Timestamp;
    senderName: string;
    roomId: RoomId;
}
export type MessageId = bigint;
export interface MessageView {
    id: MessageId;
    body: string;
    isMine: boolean;
    isRead: boolean;
    sender: UserId;
    sentAt: Timestamp;
    senderName: string;
    roomId: RoomId;
}
export interface OnlineUser {
    displayName: string;
    userId: UserId;
    avatarInitial: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Room {
    id: RoomId;
    name: string;
    createdAt: Timestamp;
    createdBy: UserId;
    description: string;
}
export interface RoomDetail {
    members: Array<User>;
    messages: Array<MessageView>;
    room: Room;
    typingUsers: Array<OnlineUser>;
    onlineUsers: Array<OnlineUser>;
}
export type RoomId = bigint;
export interface RoomSummary {
    id: RoomId;
    lastMessageAt?: Timestamp;
    lastMessagePreview: string;
    name: string;
    memberCount: bigint;
    isMember: boolean;
    description: string;
}
export type Timestamp = bigint;
export interface User {
    id: UserId;
    displayName: string;
    joinedAt: Timestamp;
    avatarInitial: string;
}
export type UserId = Principal;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoom(name: string, description: string): Promise<Room>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getMyProfile(): Promise<User | null>;
    getRoomDetail(roomId: RoomId): Promise<RoomDetail | null>;
    heartbeat(roomId: RoomId): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(roomId: RoomId): Promise<boolean>;
    leaveRoom(roomId: RoomId): Promise<boolean>;
    listMessages(roomId: RoomId): Promise<Array<Message>>;
    listRooms(): Promise<Array<RoomSummary>>;
    markRead(roomId: RoomId, lastReadMessageId: MessageId): Promise<void>;
    registerUser(displayName: string): Promise<User>;
    schema(): Promise<string>;
    sendMessage(roomId: RoomId, body: string): Promise<Message | null>;
    setTyping(roomId: RoomId, isTyping: boolean): Promise<void>;
}
