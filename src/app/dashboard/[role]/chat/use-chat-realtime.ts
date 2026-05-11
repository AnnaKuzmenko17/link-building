"use client";

import { useEffect, useRef } from "react";

import type { ChatParticipantUser, MessageWithSender } from "@/lib/data/chats";
import { createClient } from "@/lib/supabase/client";

import { markMessagesReadAction } from "./actions";

interface UseChatRealtimeOptions {
  chatId: string;
  currentUserId: string;
  participants: ChatParticipantUser[];
  onMessageAdded: (msg: MessageWithSender) => void;
  onMessageUpdated: (id: string, patch: Partial<MessageWithSender>) => void;
}

export function useChatRealtime({
  chatId,
  currentUserId,
  participants,
  onMessageAdded,
  onMessageUpdated,
}: UseChatRealtimeOptions): void {
  const participantsRef = useRef(participants);
  const onMessageAddedRef = useRef(onMessageAdded);
  const onMessageUpdatedRef = useRef(onMessageUpdated);

  useEffect(() => {
    participantsRef.current = participants;
  });
  useEffect(() => {
    onMessageAddedRef.current = onMessageAdded;
  });
  useEffect(() => {
    onMessageUpdatedRef.current = onMessageUpdated;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string;
            chat_id: string;
            sender_id: string;
            body: string;
            read_by: string[];
            created_at: string;
          };

          if (newMsg.sender_id === currentUserId) return;

          const sender = participantsRef.current.find(
            (p) => p.id === newMsg.sender_id
          ) ?? {
            id: newMsg.sender_id,
            first_name: "",
            last_name: "Unknown",
            avatar_url: null,
          };

          onMessageAddedRef.current({
            id: newMsg.id,
            chat_id: newMsg.chat_id,
            sender_id: newMsg.sender_id,
            body: newMsg.body,
            read_by: newMsg.read_by,
            created_at: newMsg.created_at,
            sender,
          });

          markMessagesReadAction(chatId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; read_by: string[] };
          onMessageUpdatedRef.current(updated.id, {
            read_by: updated.read_by,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);
}
