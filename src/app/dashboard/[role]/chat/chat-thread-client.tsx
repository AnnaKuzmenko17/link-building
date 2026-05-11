"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { ArchiveIcon, SendHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import type { ChatDetail, MessageWithSender } from "@/lib/data/chats";
import { Button, Textarea } from "@/components/ui";

import { markMessagesReadAction, sendMessageAction } from "./actions";
import { MessageBubble } from "./message-bubble";
import { useChatMessages } from "./use-chat-messages";
import { useChatRealtime } from "./use-chat-realtime";
import { formatDateLabel } from "./utils";

interface Props {
  chat: ChatDetail;
  initialMessages: MessageWithSender[];
  currentUserId: string;
}

export function ChatThreadClient({
  chat,
  initialMessages,
  currentUserId,
}: Props) {
  const { messages, addMessage, updateMessage, removeMessage } =
    useChatMessages(initialMessages);
  const [body, setBody] = useState("");
  const [isSending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isArchived = chat.status === "archived";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    markMessagesReadAction(chat.id);
  }, [chat.id]);

  useChatRealtime({
    chatId: chat.id,
    currentUserId,
    participants: chat.participants,
    onMessageAdded: addMessage,
    onMessageUpdated: updateMessage,
  });

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || isArchived) return;

    const currentSender = chat.participants.find(
      (p) => p.id === currentUserId
    ) ?? {
      id: currentUserId,
      first_name: "",
      last_name: "Me",
      avatar_url: null,
    };

    const optimistic: MessageWithSender = {
      id: `optimistic-${Date.now()}`,
      chat_id: chat.id,
      sender_id: currentUserId,
      body: trimmed,
      read_by: [],
      created_at: new Date().toISOString(),
      sender: currentSender,
    };

    addMessage(optimistic);
    setBody("");

    startSending(async () => {
      const result = await sendMessageAction(chat.id, trimmed);
      if (!result.success) {
        toast.error(result.error);
        removeMessage(optimistic.id);
        setBody(trimmed);
      }
    });
  }, [
    body,
    chat.id,
    chat.participants,
    currentUserId,
    isArchived,
    addMessage,
    removeMessage,
  ]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const lastOwnMessageId = useMemo(() => {
    const last = messages[messages.length - 1];
    return last?.sender_id === currentUserId ? last.id : undefined;
  }, [messages, currentUserId]);

  const messagesWithLabels = useMemo(
    () =>
      messages.map((msg, i) => {
        const dateLabel = formatDateLabel(msg.created_at);
        const prevLabel =
          i > 0 ? formatDateLabel(messages[i - 1].created_at) : "";
        return { msg, dateLabel, showDateLabel: dateLabel !== prevLabel };
      }),
    [messages]
  );

  return (
    <div className="bg-background flex h-[calc(100vh-220px)] flex-col rounded-lg border">
      <div className="chat-messages flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-muted-foreground mt-8 text-center text-sm">
            No messages yet. Start the conversation.
          </p>
        )}
        {messagesWithLabels.map(({ msg, dateLabel, showDateLabel }) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.sender_id === currentUserId}
            dateLabel={dateLabel}
            showDateLabel={showDateLabel}
            isLastOwn={msg.id === lastOwnMessageId}
            participants={chat.participants}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isArchived ? (
        <div className="text-muted-foreground bg-muted/30 flex items-center gap-2 border-t px-4 py-3 text-sm">
          <ArchiveIcon className="size-4 shrink-0" />
          <span>This chat is archived. Unarchive it to send messages.</span>
        </div>
      ) : (
        <div className="flex items-end gap-2 border-t p-3">
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            maxLength={5000}
            className="max-h-30 min-h-10 flex-1 resize-none"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!body.trim() || isSending}
            aria-label="Send message"
          >
            <SendHorizontalIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
