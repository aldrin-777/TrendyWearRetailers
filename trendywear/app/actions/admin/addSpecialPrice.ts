"use server";

import { createClient } from "@/utils/supabase/server";

export async function addSpecialPrice(data: {
  itemId: number;
  specialPrice: number;
  validTo: string;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data: dbUser, error: dbError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (dbError || !dbUser?.is_admin) throw new Error("Unauthorized");

  const validTo = new Date(data.validTo);
  if (Number.isNaN(validTo.getTime())) throw new Error("Invalid end date");

  const { error } = await supabase.from("prices").insert({
    item_id: data.itemId,
    price: data.specialPrice,
    priority: 1,
    valid_from: new Date().toISOString(),
    valid_to: validTo.toISOString(),
  });

  if (error) throw new Error(error.message);
}
