import type { ChatCategory, ChatStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type ChatParticipantUser = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export type ChatWithPreview = {
  id: string;
  category: ChatCategory;
  status: ChatStatus;
  title: string;
  created_at: string;
  participants: ChatParticipantUser[];
  last_message: {
    body: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
};

export type MessageWithSender = {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  read_by: string[];
  created_at: string;
  sender: ChatParticipantUser;
};

export type ChatDetail = {
  id: string;
  category: ChatCategory;
  status: ChatStatus;
  title: string;
  created_at: string;
  participants: ChatParticipantUser[];
};

export async function getChatsForUser(
  supabase: Client,
  userId: string
): Promise<ChatWithPreview[]> {
  const { data: participations } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", userId);

  if (!participations || participations.length === 0) return [];

  const chatIds = participations.map((p) => p.chat_id);

  const { data: chats } = await supabase
    .from("chats")
    .select("id, category, status, title, created_at")
    .in("id", chatIds);

  if (!chats || chats.length === 0) return [];

  const { data: allParticipants } = await supabase
    .from("chat_participants")
    .select("chat_id, user_id, users(id, first_name, last_name, avatar_url)")
    .in("chat_id", chatIds);

  const { data: allMessages } = await supabase
    .from("messages")
    .select("id, chat_id, body, created_at, sender_id, read_by")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false });

  return chats
    .map((chat) => {
      const chatParticipants = (allParticipants ?? [])
        .filter((p) => p.chat_id === chat.id)
        .map((p) => p.users as ChatParticipantUser)
        .filter(Boolean);

      const chatMessages = (allMessages ?? []).filter(
        (m) => m.chat_id === chat.id
      );
      const lastMessage = chatMessages[0] ?? null;
      const unreadCount = chatMessages.filter(
        (m) => m.sender_id !== userId && !m.read_by.includes(userId)
      ).length;

      return {
        id: chat.id,
        category: chat.category as ChatCategory,
        status: chat.status as ChatStatus,
        title: chat.title,
        created_at: chat.created_at,
        participants: chatParticipants,
        last_message: lastMessage
          ? {
              body: lastMessage.body,
              created_at: lastMessage.created_at,
              sender_id: lastMessage.sender_id,
            }
          : null,
        unread_count: unreadCount,
      };
    })
    .sort((a, b) => {
      const aTime = a.last_message?.created_at ?? a.created_at;
      const bTime = b.last_message?.created_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });
}

export async function getChatById(
  supabase: Client,
  chatId: string,
  userId: string,
  callerRole?: string
): Promise<ChatDetail | null> {
  const isAdmin = callerRole === "admin";

  if (!isAdmin) {
    const { data: participation } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!participation) return null;
  }

  // Admins bypass RLS — use admin client so they can read any chat.
  const reader = isAdmin ? createAdminClient() : supabase;

  const { data: chat } = await reader
    .from("chats")
    .select("id, category, status, title, created_at")
    .eq("id", chatId)
    .maybeSingle();

  if (!chat) return null;

  const { data: participants } = await reader
    .from("chat_participants")
    .select("user_id, users(id, first_name, last_name, avatar_url)")
    .eq("chat_id", chatId);

  return {
    id: chat.id,
    category: chat.category as ChatCategory,
    status: chat.status as ChatStatus,
    title: chat.title,
    created_at: chat.created_at,
    participants: (participants ?? [])
      .map((p) => p.users as ChatParticipantUser)
      .filter(Boolean),
  };
}

export async function getOrderForChat(
  supabase: Client,
  chatId: string
): Promise<{ id: string; title: string } | null> {
  const { data } = await supabase
    .from("orders")
    .select("id, sites(domain)")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (!data) return null;
  const site = data.sites as { domain: string } | null;
  return { id: data.id, title: site?.domain ?? "Order" };
}

export async function getMessagesForChat(
  supabase: Client,
  chatId: string
): Promise<MessageWithSender[]> {
  const { data } = await supabase
    .from("messages")
    .select(
      "id, chat_id, sender_id, body, read_by, created_at, users(id, first_name, last_name, avatar_url)"
    )
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((m) => ({
    id: m.id,
    chat_id: m.chat_id,
    sender_id: m.sender_id,
    body: m.body,
    read_by: m.read_by,
    created_at: m.created_at,
    sender: (m.users as ChatParticipantUser | null) ?? {
      id: m.sender_id,
      first_name: "Deleted",
      last_name: "User",
      avatar_url: null,
    },
  }));
}

export async function sendMessage(
  supabase: Client,
  chatId: string,
  senderId: string,
  body: string
): Promise<{ data: MessageWithSender | null; error: string | null }> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: senderId, body, read_by: [] })
    .select(
      "id, chat_id, sender_id, body, read_by, created_at, users(id, first_name, last_name, avatar_url)"
    )
    .single();

  if (error || !data)
    return { data: null, error: error?.message ?? "Failed to send." };

  return {
    data: {
      id: data.id,
      chat_id: data.chat_id,
      sender_id: data.sender_id,
      body: data.body,
      read_by: data.read_by,
      created_at: data.created_at,
      sender: data.users as ChatParticipantUser,
    },
    error: null,
  };
}

export async function markMessagesRead(
  supabase: Client,
  chatId: string,
  userId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)("mark_messages_read", {
    p_chat_id: chatId,
    p_user_id: userId,
  });
}

export async function getTotalUnreadCount(
  supabase: Client,
  userId: string
): Promise<number> {
  const { data: participations } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", userId);

  if (!participations || participations.length === 0) return 0;

  const chatIds = participations.map((p) => p.chat_id);

  const { data: messages } = await supabase
    .from("messages")
    .select("sender_id, read_by")
    .in("chat_id", chatIds);

  if (!messages) return 0;

  return messages.filter(
    (m) => m.sender_id !== userId && !(m.read_by as string[]).includes(userId)
  ).length;
}

export async function createChat(
  supabase: Client,
  category: ChatCategory,
  participantIds: string[],
  title: string,
  createdBy: string
): Promise<{ chatId: string | null; error: string | null }> {
  const chatId = crypto.randomUUID();

  const { error: chatError } = await supabase.from("chats").insert({
    id: chatId,
    category,
    title,
    created_by: createdBy,
    status: "active",
  });

  if (chatError) return { chatId: null, error: chatError.message };

  const rows = participantIds.map((uid) => ({ chat_id: chatId, user_id: uid }));
  const { error: participantsError } = await supabase
    .from("chat_participants")
    .insert(rows);

  if (participantsError)
    return { chatId: null, error: participantsError.message };

  return { chatId, error: null };
}

export async function updateChat(
  supabase: Client,
  chatId: string,
  title: string,
  participantIds: string[]
): Promise<{ error: string | null }> {
  const { error: titleError } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", chatId)
    .eq("category", "general");

  if (titleError) return { error: titleError.message };

  const { data: existing } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_id", chatId);

  const existingIds = new Set((existing ?? []).map((p) => p.user_id));
  const newIds = new Set(participantIds);

  const toAdd = participantIds.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !newIds.has(id));

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("chat_participants")
      .insert(toAdd.map((uid) => ({ chat_id: chatId, user_id: uid })));
    if (error) return { error: error.message };
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("chat_participants")
      .delete()
      .eq("chat_id", chatId)
      .in("user_id", toRemove);
    if (error) return { error: error.message };
  }

  return { error: null };
}

export async function setChatStatus(
  supabase: Client,
  chatId: string,
  status: ChatStatus
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("chats")
    .update({ status })
    .eq("id", chatId)
    .eq("category", "general");

  return { error: error?.message ?? null };
}

export async function searchUsersForChat(
  supabase: Client,
  query: string,
  callerRole: string,
  callerId: string
): Promise<
  {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }[]
> {
  if (callerRole === "client") return [];

  // Use admin client so RLS doesn't block lookups of other users
  const admin = createAdminClient();
  const q = `%${query.trim()}%`;
  const baseQuery = () =>
    admin
      .from("users")
      .select("id, first_name, last_name, email, role")
      .eq("status", "active")
      .or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`)
      .limit(20);

  if (callerRole === "admin") {
    const { data } = await baseQuery();
    return data ?? [];
  }

  if (callerRole === "manager") {
    const { data } = await baseQuery().eq("role", "copywriter");
    return data ?? [];
  }

  if (callerRole === "sourcer") {
    const { data } = await baseQuery().eq("role", "admin");
    return data ?? [];
  }

  if (callerRole === "copywriter") {
    // orders RLS allows copywriter to read their own orders — use regular client
    const { data: orders } = await supabase
      .from("orders")
      .select("client_id")
      .eq("copywriter_id", callerId)
      .not("client_id", "is", null);

    const clientIds = [
      ...new Set((orders ?? []).map((o) => o.client_id as string)),
    ];

    let managerIds: string[] = [];
    if (clientIds.length > 0) {
      const { data: clients } = await admin
        .from("users")
        .select("manager_id")
        .in("id", clientIds)
        .not("manager_id", "is", null);
      managerIds = [
        ...new Set((clients ?? []).map((c) => c.manager_id as string)),
      ];
    }

    const { data: admins } = await admin
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("status", "active");
    const adminIds = (admins ?? []).map((a) => a.id);

    const allowedIds = [...new Set([...managerIds, ...adminIds])];
    if (allowedIds.length === 0) return [];

    const { data } = await baseQuery().in("id", allowedIds);
    return data ?? [];
  }

  return [];
}

export async function createSupportChatForUser(
  supabase: Client,
  newUserId: string
): Promise<void> {
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin")
    .eq("status", "active");

  if (!admins || admins.length === 0) return;

  const participantIds = Array.from(
    new Set([newUserId, ...admins.map((a) => a.id)])
  );
  await createChat(supabase, "support", participantIds, "Support", newUserId);
}

export async function ensureDefaultChatsForClient(
  supabase: Client,
  clientUserId: string
): Promise<void> {
  const { data: participations } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", clientUserId);

  const chatIds = (participations ?? []).map((p) => p.chat_id);

  let hasSupport = false;
  let hasSales = false;

  if (chatIds.length > 0) {
    const { data: existing } = await supabase
      .from("chats")
      .select("category")
      .in("id", chatIds)
      .in("category", ["support", "sales"]);

    for (const c of existing ?? []) {
      if (c.category === "support") hasSupport = true;
      if (c.category === "sales") hasSales = true;
    }
  }

  if (!hasSupport) await createSupportChatForUser(supabase, clientUserId);
  if (!hasSales) await createSalesChatForClient(supabase, clientUserId);
}

export async function createSalesChatForClient(
  supabase: Client,
  clientUserId: string
): Promise<void> {
  // Check if a sales chat already exists for this client
  const { data: clientParticipations } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", clientUserId);

  if (clientParticipations && clientParticipations.length > 0) {
    const chatIds = clientParticipations.map((p) => p.chat_id);
    const { data: salesChats } = await supabase
      .from("chats")
      .select("id")
      .in("id", chatIds)
      .eq("category", "sales");

    if (salesChats && salesChats.length > 0) return;
  }

  // Get the client's assigned manager
  const { data: client } = await supabase
    .from("users")
    .select("manager_id")
    .eq("id", clientUserId)
    .maybeSingle();

  if (!client?.manager_id) {
    console.warn(
      "[createSalesChatForClient] client has no manager_id, skipping"
    );
    return;
  }

  const participantIds = [clientUserId, client.manager_id];
  await createChat(supabase, "sales", participantIds, "Sales", clientUserId);
}

export async function ensureManagerInClientSalesChat(
  supabase: Client,
  clientUserId: string,
  managerId: string
): Promise<void> {
  const { data: clientParticipations } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", clientUserId);

  if (!clientParticipations || clientParticipations.length === 0) return;

  const chatIds = clientParticipations.map((p) => p.chat_id);

  const { data: salesChats } = await supabase
    .from("chats")
    .select("id")
    .in("id", chatIds)
    .eq("category", "sales");

  if (!salesChats || salesChats.length === 0) return;

  const salesChatId = salesChats[0].id;

  const { data: existing } = await supabase
    .from("chat_participants")
    .select("id")
    .eq("chat_id", salesChatId)
    .eq("user_id", managerId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("chat_participants").insert({
      chat_id: salesChatId,
      user_id: managerId,
    });
  }
}

export async function startOrderChat(
  supabase: Client,
  orderId: string,
  currentUserId: string
): Promise<{ chatId: string | null; error: string | null }> {
  // Read order with site domain and client's manager
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, chat_id, copywriter_id, client_id, sites(domain), users!orders_client_id_fkey(manager_id)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { chatId: null, error: "Order not found." };

  if (order.chat_id) return { chatId: order.chat_id, error: null };

  const site = order.sites as { domain: string } | null;
  const clientUser = order.users as { manager_id: string | null } | null;
  const title = site?.domain ?? "Order Chat";

  const participantIds = Array.from(
    new Set(
      [
        currentUserId,
        order.copywriter_id,
        order.client_id,
        clientUser?.manager_id,
      ].filter((id): id is string => !!id)
    )
  );

  if (participantIds.length < 2) {
    return { chatId: null, error: "Not enough participants to create a chat." };
  }

  const { chatId, error } = await createChat(
    supabase,
    "general",
    participantIds,
    title,
    currentUserId
  );
  if (error || !chatId)
    return { chatId: null, error: error ?? "Failed to create chat." };

  await supabase.from("orders").update({ chat_id: chatId }).eq("id", orderId);

  return { chatId, error: null };
}
