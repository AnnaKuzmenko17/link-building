import { requireSession } from "@/lib/auth/get-session";
import { getChatsForUser } from "@/lib/data/chats";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

import { ChatListClient } from "./chat-list-client";

interface Props {
  params: Promise<{ role: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { role } = await params;
  const { user } = await requireSession();
  const supabase = await createClient();
  const chats = await getChatsForUser(supabase, user.id);

  const canCreate = role !== "client";
  const showCategoryFilter = role === "admin" || role === "client";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Chat" />
      <ChatListClient
        chats={chats}
        userId={user.id}
        role={role}
        canCreate={canCreate}
        showCategoryFilter={showCategoryFilter}
      />
    </div>
  );
}
