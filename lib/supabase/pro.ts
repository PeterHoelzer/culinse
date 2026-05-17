import { createClient } from "@/lib/supabase/server";

export interface ProStatus {
  isPro: boolean;
  collectionsCount: number;
}

/** Server-side: check if the current user is Pro */
export async function getUserProStatus(): Promise<ProStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isPro: false, collectionsCount: 0 };

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("is_pro").eq("id", user.id).single(),
    supabase
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return {
    isPro: profile?.is_pro ?? false,
    collectionsCount: count ?? 0,
  };
}
