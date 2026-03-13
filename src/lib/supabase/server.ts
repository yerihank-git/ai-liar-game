import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * 서버사이드 전용 Supabase 클라이언트 (service_role 키 사용)
 * API Routes에서만 사용. 클라이언트 컴포넌트에서 절대 import 금지.
 */
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
