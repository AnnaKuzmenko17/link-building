import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatThreadClient } from "@/app/dashboard/[role]/chat/chat-thread-client";
import { ExternalLinkIcon } from "lucide-react";

import { requireSession } from "@/lib/auth/get-session";
import {
  getChatById,
  getMessagesForChat,
  getOrderForChat,
} from "@/lib/data/chats";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";
import { BackButton } from "@/components/shared";
import { Badge } from "@/components/ui";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

const categoryLabel: Record<string, string> = {
  support: "Support",
  sales: "Sales",
  general: "Standard",
};

export default async function ChatThreadPage({ params }: Props) {
  const { role, id } = await params;
  const { user } = await requireSession();
  const supabase = await createClient();

  const [chat, messages, linkedOrder] = await Promise.all([
    getChatById(supabase, id, user.id, role),
    getMessagesForChat(supabase, id),
    getOrderForChat(supabase, id),
  ]);

  if (!chat) {
    console.log(chat);
    notFound();
  }

  const otherParticipants = chat.participants.filter((p) => p.id !== user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <BackButton fallbackHref={`/dashboard/${role}/chat`} />
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
            {chat.title}
          </h1>
          {otherParticipants.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {otherParticipants.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-medium">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(p.first_name, p.last_name)
                    )}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {p.first_name} {p.last_name}
                  </span>
                </div>
              ))}
              {otherParticipants.length > 3 && (
                <span className="text-muted-foreground text-sm">
                  +{otherParticipants.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        <Badge variant="outline" className="shrink-0">
          {categoryLabel[chat.category] ?? chat.category}
        </Badge>
        {chat.status === "archived" && (
          <Badge variant="secondary" className="shrink-0">
            Archived
          </Badge>
        )}
        {linkedOrder && (
          <Link
            href={`/dashboard/${role}/orders/${linkedOrder.id}`}
            className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 text-sm transition-colors"
          >
            <ExternalLinkIcon className="size-3.5" />
            View order
          </Link>
        )}
      </div>
      <ChatThreadClient
        chat={chat}
        initialMessages={messages}
        currentUserId={user.id}
      />
    </div>
  );
}
