import { ChatDetail } from "@/lib/data/chats";

import { User } from "./types";

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function userName(u: User) {
  return `${u.first_name} ${u.last_name}`.trim() || u.email;
}

export function defaultTitle(selected: User[]): string {
  return selected.map(userName).join(", ");
}

export function initialSelected(
  editChat: ChatDetail | undefined,
  currentUserId: string
): User[] {
  if (!editChat) return [];
  return editChat.participants
    .filter((p) => p.id !== currentUserId)
    .map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: "",
      role: "",
    }));
}
