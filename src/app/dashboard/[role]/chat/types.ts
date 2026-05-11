import z from "zod";

export type CreateResult =
  | { success: true; chatId: string }
  | { success: false; error: string };

export type SearchResult =
  | {
      success: true;
      users: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
      }[];
    }
  | { success: false; error: string };

export const chatIdSchema = z.uuid();

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};
