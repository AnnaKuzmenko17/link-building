import { requireSession } from "@/lib/auth/get-session";
import { getCartItems } from "@/lib/data/cart";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

import { CartClient } from "./cart-client";

export default async function CartPage() {
  const { user } = await requireSession();
  const supabase = await createClient();
  const cartItems = await getCartItems(supabase, user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cart" />
      <CartClient cartItems={cartItems} />
    </div>
  );
}
