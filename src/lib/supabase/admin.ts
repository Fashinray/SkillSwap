import { createClient } from '@supabase/supabase-js'

export function createAdminClient(options?: { noStore?: boolean }) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    options?.noStore
      ? {
          global: {
            // Supabase-js calls fetch() under the hood; Next.js's fetch
            // patching caches responses unless told otherwise. Routes that
            // need every call to hit the DB fresh (e.g. match compute,
            // right after an admin approval) opt into this explicitly.
            fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
          },
        }
      : undefined
  )
}
