"use client";

import { useCallback, useState } from "react";

import type { MessageWithSender } from "@/lib/data/chats";

interface UseChatMessagesReturn {
  messages: MessageWithSender[];
  addMessage: (msg: MessageWithSender) => void;
  updateMessage: (id: string, patch: Partial<MessageWithSender>) => void;
  removeMessage: (id: string) => void;
}

export function useChatMessages(
  initialMessages: MessageWithSender[]
): UseChatMessagesReturn {
  const [messages, setMessages] =
    useState<MessageWithSender[]>(initialMessages);

  const addMessage = useCallback((msg: MessageWithSender) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<MessageWithSender>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { messages, addMessage, updateMessage, removeMessage };
}
