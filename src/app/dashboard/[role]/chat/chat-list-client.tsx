"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ChatCategory, ChatStatus } from "@/types";
import { MessageCircleIcon, PlusIcon } from "lucide-react";

import type { ChatWithPreview } from "@/lib/data/chats";
import { getInitials } from "@/lib/utils";
import { Badge, Button, Input } from "@/components/ui";

import { categoryLabels } from "./constants";
import { CreateChatDialog } from "./create-chat-dialog";
import { formatRelativeTime } from "./utils";

interface Props {
  chats: ChatWithPreview[];
  userId: string;
  role: string;
  canCreate: boolean;
  showCategoryFilter?: boolean;
}

export function ChatListClient({
  chats,
  userId,
  role,
  canCreate,
  showCategoryFilter = false,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ChatCategory | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<ChatStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return chats.filter((chat) => {
      if (categoryFilter !== "all" && chat.category !== categoryFilter)
        return false;
      if (statusFilter !== "all" && chat.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const titleMatch = chat.title.toLowerCase().includes(q);
        const participantMatch = chat.participants.some((p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
        );
        const messageMatch = chat.last_message?.body.toLowerCase().includes(q);
        if (!titleMatch && !participantMatch && !messageMatch) return false;
      }
      return true;
    });
  }, [chats, categoryFilter, statusFilter, search]);

  const categories: (ChatCategory | "all")[] = [
    "all",
    "support",
    "sales",
    "general",
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search chats…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        {showCategoryFilter && (
          <div className="flex gap-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {categoryLabels[cat]}
              </Button>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          {(["all", "active", "archived"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        {canCreate && (
          <div className="ml-auto">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              New Chat
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <MessageCircleIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            {chats.length === 0
              ? "No chats yet."
              : "No chats match your filters."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {filtered.map((chat) => {
            const timeStr = chat.last_message?.created_at ?? chat.created_at;
            const otherParticipants = chat.participants.filter(
              (p) => p.id !== userId
            );

            return (
              <button
                key={chat.id}
                className="hover:bg-muted/30 flex items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
                onClick={() =>
                  router.push(`/dashboard/${role}/chat/${chat.id}`)
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {categoryLabels[chat.category]}
                    </Badge>
                    {chat.status === "archived" && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        Archived
                      </Badge>
                    )}
                    <span className="truncate text-sm font-medium">
                      {chat.title}
                    </span>
                  </div>
                  {otherParticipants.length > 0 && (
                    <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden">
                      {otherParticipants.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="flex shrink-0 items-center gap-1"
                        >
                          <div className="bg-muted flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-medium">
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.avatar_url}
                                alt=""
                                className="h-4 w-4 rounded-full object-cover"
                              />
                            ) : (
                              getInitials(p.first_name, p.last_name)
                            )}
                          </div>
                          <span className="text-muted-foreground truncate text-xs">
                            {p.first_name} {p.last_name}
                          </span>
                        </div>
                      ))}
                      {otherParticipants.length > 3 && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                          +{otherParticipants.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-muted-foreground truncate text-sm">
                    {chat.last_message
                      ? chat.last_message.body
                      : "No messages yet"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(timeStr)}
                  </span>
                  {chat.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium">
                      {chat.unread_count > 99 ? "99+" : chat.unread_count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {canCreate && (
        <CreateChatDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          role={role}
          currentUserId={userId}
        />
      )}
    </div>
  );
}
