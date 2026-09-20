import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    // 1. Verificar sesión
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'No autorizado' }, 401)

    // 2. Verificar que es admin
    const { data: account } = await userClient.from('account').select('tipo').eq('auth_id', user.id).single()
    if (account?.tipo !== 'admin') return json({ error: 'Acceso denegado' }, 403)

    // 3. Leer body
    const { request_id, admin_notes } = await req.json()
    if (!request_id) return json({ error: 'request_id es requerido' }, 400)

    // 4. Operaciones con service role (bypasea RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: req_data, error: reqErr } = await admin
      .from('business_edit_request')
      .select('*')
      .eq('id', request_id)
      .eq('status', 'pending')
      .single()

    if (reqErr || !req_data) return json({ error: 'Solicitud no encontrada o ya procesada' }, 404)

    const { site_id, type, action, payload } = req_data

    // 5. Obtener company_id para insertar imágenes
    const { data: siteRow } = await admin.from('site').select('company_id').eq('id', site_id).single()
    const company_id = siteRow?.company_id

    // 6. Aplicar el cambio según type + action
    if (type === 'profile' && action === 'update') {
      await applyProfileUpdate(admin, site_id, company_id, payload)

    } else if (type === 'service') {
      await applyServiceChange(admin, site_id, company_id, action, payload)

    } else if (type === 'promo') {
      await applyPromoChange(admin, site_id, company_id, action, payload)

    } else if (type === 'event') {
      await applyEventChange(admin, site_id, company_id, action, payload)
    }

    // 7. Marcar como aprobado
    await admin.from('business_edit_request').update({
      status:      'approved',
      admin_notes: admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', request_id)

    return json({ success: true }, 200)

  } catch (err: any) {
    console.error('approve-edit-request error:', err)
    return json({ error: err.message }, 500)
  }
})

// ─── Profile update ──────────────────────────────────────────────────────────
async function applyProfileUpdate(admin: any, site_id: number, company_id: number, p: any) {
  // Update site
  await admin.from('site').update({
    name:         p.business_name,
    address:      p.address,
    details:      p.description ?? '',
    mean_price:   p.mean_price ? Number(p.mean_price) : null,
    zone_id:      p.zone_id ?? null,
    location_lat: p.location_lat ?? null,
    location_lng: p.location_lng ?? null,
    logo_url:     p.logo_url || null,
  }).eq('id', site_id)

  // Update company name + description
  await admin.from('company').update({
    name:        p.business_name,
    description: p.description ?? '',
  }).eq('id', company_id)

  // Replace business hours
  await admin.from('business_hours').delete().eq('site_id', site_id)
  if (Array.isArray(p.business_hours) && p.business_hours.length > 0) {
    await admin.from('business_hours').insert(
      p.business_hours.map((h: any) => ({
        site_id,
        weekday:    h.weekday,
        start_time: h.start_time,
        end_time:   h.end_time,
      }))
    )
  }

  // Replace contacts
  await admin.from('company_contact').delete().eq('company_id', company_id)
  const contacts = (p.contacts ?? []).filter((c: any) => c.link?.trim())
  if (contacts.length > 0) {
    await admin.from('company_contact').insert(
      contacts.map((c: any) => ({ company_id, link: c.link, method: c.method }))
    )
  }
}

// ─── Service changes ─────────────────────────────────────────────────────────
async function applyServiceChange(admin: any, site_id: number, company_id: number, action: string, p: any) {
  if (action === 'delete' && p.service_id) {
    const { data: imgs } = await admin.from('service_image').select('image_id').eq('service_id', p.service_id)
    if (imgs?.length) {
      await admin.from('service_image').delete().eq('service_id', p.service_id)
      await admin.from('image').delete().in('id', imgs.map((i: any) => i.image_id))
    }
    await admin.from('service').delete().eq('id', p.service_id)
    return
  }

  const serviceFields = {
    site_id,
    name:          p.name,
    price:         p.price ? Number(p.price) : null,
    pricing_type:  mapChargeType(p.charge_type),
    capacity:      p.capacity ? Number(p.capacity) : null,
    duration_mins: extractMinutes(p.duration),
    description:   p.description ?? '',
    active:        true,
  }

  if (action === 'create') {
    const { data: svc } = await admin.from('service').insert(serviceFields).select('id').single()
    if (svc && Array.isArray(p.image_urls)) {
      await insertImages(admin, 'service', svc.id, company_id, p.name, p.image_urls)
    }
  } else if (action === 'update' && p.service_id) {
    await admin.from('service').update(serviceFields).eq('id', p.service_id)
  }
}

// ─── Promo changes ───────────────────────────────────────────────────────────
async function applyPromoChange(admin: any, site_id: number, company_id: number, action: string, p: any) {
  if (action === 'delete' && p.promo_id) {
    const { data: imgs } = await admin.from('promotion_image').select('image_id').eq('promotion_id', p.promo_id)
    if (imgs?.length) {
      await admin.from('promotion_image').delete().eq('promotion_id', p.promo_id)
      await admin.from('image').delete().in('id', imgs.map((i: any) => i.image_id))
    }
    await admin.from('promotion').delete().eq('id', p.promo_id)
    return
  }

  const fields = { site_id, title: p.title, description: p.description ?? '', active: true }

  if (action === 'create') {
    const { data: promo } = await admin.from('promotion').insert(fields).select('id').single()
    if (promo && p.image_url) {
      const { data: img } = await admin.from('image').insert({
        img_url: p.image_url, type: 'cover', date: new Date().toISOString(),
        visible: true, name: p.title, description: p.title, company_id,
      }).select('id').single()
      if (img) {
        await admin.from('promotion_image').insert({ promotion_id: promo.id, image_id: img.id })
        await admin.from('promotion').update({ promotion_img_url: p.image_url }).eq('id', promo.id)
      }
    }
  } else if (action === 'update' && p.promo_id) {
    await admin.from('promotion').update({ title: p.title, description: p.description }).eq('id', p.promo_id)
    if (p.image_url) {
      await admin.from('promotion').update({ promotion_img_url: p.image_url }).eq('id', p.promo_id)
    }
  }
}

// ─── Event changes ───────────────────────────────────────────────────────────
async function applyEventChange(admin: any, site_id: number, company_id: number, action: string, p: any) {
  if (action === 'delete' && p.event_id) {
    const { data: imgs } = await admin.from('event_image').select('image_id').eq('event_id', p.event_id)
    if (imgs?.length) {
      await admin.from('event_image').delete().eq('event_id', p.event_id)
      await admin.from('image').delete().in('id', imgs.map((i: any) => i.image_id))
    }
    await admin.from('event').delete().eq('id', p.event_id)
    return
  }

  const startTs = p.fecha_inicio ? `${p.fecha_inicio} ${p.hora ?? '00:00'}` : null
  const endTs   = p.fecha_fin    ? `${p.fecha_fin} ${p.hora ?? '00:00'}`   : null
  const fields = {
    site_id,
    title:       p.titulo,
    description: p.descripcion ?? '',
    start_date:  startTs,
    end_date:    endTs,
    price:       p.precio ? Number(p.precio) : null,
    active:      true,
  }

  if (action === 'create') {
    const { data: ev } = await admin.from('event').insert(fields).select('id').single()
    if (ev && Array.isArray(p.image_urls) && p.image_urls.length > 0) {
      await insertImages(admin, 'event', ev.id, company_id, p.titulo, p.image_urls)
    }
  } else if (action === 'update' && p.event_id) {
    await admin.from('event').update({ title: p.titulo, description: p.descripcion, start_date: startTs, end_date: endTs, price: fields.price }).eq('id', p.event_id)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function insertImages(admin: any, table: 'service' | 'event', entityId: number, company_id: number, name: string, urls: string[]) {
  for (const url of urls) {
    const { data: img } = await admin.from('image').insert({
      img_url: url, type: 'cover', date: new Date().toISOString(),
      visible: true, name, description: name, company_id,
    }).select('id').single()
    if (img) {
      const junctionTable = table === 'service' ? 'service_image' : 'event_image'
      const fkCol         = table === 'service' ? 'service_id'    : 'event_id'
      await admin.from(junctionTable).insert({ [fkCol]: entityId, image_id: img.id })
    }
  }
}

function mapChargeType(t: string): string {
  const m: Record<string, string> = {
    gratis: 'FREE', por_persona: 'PER_PERSON', con_consumo: 'VARIABLE', por_servicio: 'VARIABLE',
  }
  return m[t] ?? 'VARIABLE'
}

function extractMinutes(duration: string | undefined): number | null {
  if (!duration) return null
  const num = parseInt(duration.replace(/\D/g, ''), 10)
  return isNaN(num) ? null : num
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
