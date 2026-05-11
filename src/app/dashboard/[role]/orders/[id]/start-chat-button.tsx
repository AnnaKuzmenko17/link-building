"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { startOrderChatAction } from "@/app/dashboard/[role]/chat/actions";
import { MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui";

interface Props {
  orderId: string;
  role: string;
  chatId?: string | null;
}

export function StartChatButton({ orderId, role, chatId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (chatId) {
        router.push(`/dashboard/${role}/chat/${chatId}`);
        return;
      }
      const result = await startOrderChatAction(orderId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/dashboard/${role}/chat/${result.chatId}`);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <MessageCircleIcon className="size-4" />
      {isPending ? "Opening…" : chatId ? "Open Chat" : "Start Chat"}
    </Button>
  );
}
