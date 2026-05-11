import type { ChatParticipantUser, MessageWithSender } from "@/lib/data/chats";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";

import { formatTime } from "./utils";

interface MessageBubbleProps {
  msg: MessageWithSender;
  isOwn: boolean;
  dateLabel: string;
  showDateLabel: boolean;
  isLastOwn: boolean;
  participants: ChatParticipantUser[];
}

function UserAvatar({
  user,
  size,
}: {
  user: ChatParticipantUser;
  size: "sm" | "xs";
}) {
  const name = `${user.first_name} ${user.last_name}`.trim() || "Unknown";

  return (
    <Avatar
      size="sm"
      className={size === "xs" ? "size-4" : undefined}
      title={name}
    >
      <AvatarImage src={user.avatar_url ?? undefined} alt="" />
      <AvatarFallback className={size === "xs" ? "text-[8px]" : undefined}>
        {getInitials(user.first_name, user.last_name)}
      </AvatarFallback>
    </Avatar>
  );
}

function ReadReceipts({
  readBy,
  senderId,
  participants,
}: {
  readBy: string[];
  senderId: string;
  participants: ChatParticipantUser[];
}) {
  const readers = readBy
    .filter((id) => id !== senderId)
    .map((id) => participants.find((p) => p.id === id))
    .filter(Boolean) as ChatParticipantUser[];

  if (readers.length === 0) return null;

  return (
    <div className="flex flex-row-reverse items-center gap-0.5 px-1">
      {readers.slice(0, 5).map((reader) => (
        <UserAvatar key={reader.id} user={reader} size="xs" />
      ))}
      {readers.length > 5 && (
        <span className="text-muted-foreground text-[8px]">
          +{readers.length - 5}
        </span>
      )}
    </div>
  );
}

export function MessageBubble({
  msg,
  isOwn,
  dateLabel,
  showDateLabel,
  isLastOwn,
  participants,
}: MessageBubbleProps) {
  return (
    <div>
      {showDateLabel && (
        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 border-t" />
          <span className="text-muted-foreground text-xs">{dateLabel}</span>
          <div className="flex-1 border-t" />
        </div>
      )}
      <div
        className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      >
        <UserAvatar user={msg.sender} size="sm" />
        <div
          className={`flex max-w-[70%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
        >
          <span className="text-muted-foreground px-1 text-xs">
            {isOwn
              ? "You"
              : `${msg.sender.first_name} ${msg.sender.last_name}`.trim() ||
                "Unknown"}
          </span>
          <div
            className={`rounded-2xl px-3 py-2 text-sm ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted rounded-bl-sm"
            }`}
          >
            {msg.body}
          </div>
          <span className="text-muted-foreground px-1 text-[10px]">
            {formatTime(msg.created_at)}
          </span>
          {isOwn && isLastOwn && (
            <ReadReceipts
              readBy={msg.read_by}
              senderId={msg.sender_id}
              participants={participants}
            />
          )}
        </div>
      </div>
    </div>
  );
}
