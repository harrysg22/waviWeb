import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    // 1. Verificar sesión con el JWT del usuario que llama
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'No autorizado' }, 401)

    // 2. Verificar que el usuario es admin
    const { data: account } = await userClient
      .from('account')
      .select('tipo')
      .eq('auth_id', user.id)
      .single()
    if (account?.tipo !== 'admin') return json({ error: 'Acceso denegado' }, 403)

    // 3. Leer body
    const { registration_id, admin_notes } = await req.json()
    if (!registration_id) return json({ error: 'registration_id es requerido' }, 400)

    // 4. Ejecutar la función SQL con service role (bypasea RLS)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data, error } = await adminClient.rpc('approve_business_registration', {
      p_registration_id: registration_id,
      p_admin_notes:     admin_notes ?? null,
    })
    if (error) throw error

    return json(data, 200)

  } catch (err: any) {
    console.error('approve-registration error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
