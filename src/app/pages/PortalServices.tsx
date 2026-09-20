import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useBusinessSites } from '@/lib/useBusinessSite'
import PortalHeader from '@/app/components/PortalHeader'
import { Loader2, Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, Clock, Upload } from 'lucide-react'

const inputCls  = 'w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-[#25B3CC] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition-all focus:ring-2 focus:ring-[#25B3CC]/15'
const selectCls = `${inputCls} appearance-none cursor-pointer`

interface LiveService { id: number; name: string; price: number | null; pricing_type: string; capacity: number | null; duration_mins: number | null; description: string | null }
interface ServiceForm { name: string; price: string; charge_type: string; capacity: string; duration: string; description: string; image_urls: string[] }

const CHARGE_OPTIONS = [
  { value: 'gratis', label: 'Gratis' }, { value: 'con_consumo', label: 'Con consumo' },
  { value: 'por_persona', label: 'Por persona' }, { value: 'por_servicio', label: 'Por servicio' },
]
const PRICING_TO_CHARGE: Record<string, string> = { FREE: 'gratis', PER_PERSON: 'por_persona', VARIABLE: 'por_servicio' }
const EMPTY_FORM: ServiceForm = { name: '', price: '', charge_type: 'por_persona', capacity: '', duration: '', description: '', image_urls: [] }

export default function PortalServices() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [authId, setAuthId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthId(session?.user.id ?? null))
  }, [])

  const { sites, loading: sitesLoading } = useBusinessSites(authId)
  const siteIdParam  = searchParams.get('site')
  const selectedSite = sites.find(s => s.siteId === Number(siteIdParam)) ?? sites[0] ?? null
  const siteId       = selectedSite?.siteId ?? 0

  const [services,   setServices]   = useState<LiveService[]>([])
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [loading,    setLoading]    = useState(false)
  const [form,       setForm]       = useState<ServiceForm>(EMPTY_FORM)
  const [editId,     setEditId]     = useState<number | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<number | null>(null)

  const loadData = async (id: number) => {
    setLoading(true)
    const [svcRes, pendRes] = await Promise.all([
      supabase.from('service').select('*').eq('site_id', id).eq('active', true).order('id'),
      supabase.from('business_edit_request').select('payload').eq('site_id', id).eq('type', 'service').eq('status', 'pending'),
    ])
    setServices(svcRes.data ?? [])
    setPendingIds(new Set((pendRes.data ?? []).map((r: any) => r.payload?.service_id).filter(Boolean)))
    setLoading(false)
  }

  useEffect(() => { if (siteId) { setSuccess(null); loadData(siteId) } }, [siteId])

  const setF = (k: keyof ServiceForm, v: any) => setForm(prev => ({ ...prev, [k]: v }))
  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); setSuccess(null); setError(null) }
  const openEdit = (s: LiveService) => {
    setForm({ name: s.name, price: s.price?.toString() ?? '', charge_type: PRICING_TO_CHARGE[s.pricing_type] ?? 'por_servicio', capacity: s.capacity?.toString() ?? '', duration: s.duration_mins?.toString() ?? '', description: s.description ?? '', image_urls: [] })
    setEditId(s.id); setShowForm(true); setSuccess(null); setError(null)
  }

  const handleImageUpload = async (file: File) => {
    if (!authId) return
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${authId}/service-edit-${siteId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-registrations').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('business-registrations').getPublicUrl(path)
      setF('image_urls', [...form.image_urls, data.publicUrl])
    }
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!authId || !siteId) return
    if (!form.name.trim()) { setError('El nombre del servicio es obligatorio.'); return }
    setSubmitting(true); setError(null)
    const { error: insErr } = await supabase.from('business_edit_request').insert({
      site_id: siteId, auth_id: authId, type: 'service',
      action: editId ? 'update' : 'create',
      payload: { ...form, ...(editId ? { service_id: editId } : {}) },
    })
    setSubmitting(false)
    if (insErr) { setError('Error al enviar. Intenta de nuevo.'); return }
    setSuccess(editId ? 'Cambio enviado a revisión.' : 'Servicio enviado a revisión.')
    setShowForm(false)
  }

  const handleDelete = async (serviceId: number) => {
    if (!authId || !siteId) return
    const { error: insErr } = await supabase.from('business_edit_request').insert({
      site_id: siteId, auth_id: authId, type: 'service', action: 'delete', payload: { service_id: serviceId },
    })
    if (!insErr) { setSuccess('Solicitud de eliminación enviada.'); setPendingIds(prev => new Set([...prev, serviceId])) }
    setConfirmDel(null)
  }

  const backTo = `/portal?site=${siteId}`

  if (sitesLoading) return <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <PortalHeader
        title="Servicios"
        subtitle="Los cambios requieren revisión"
        backTo={backTo}
        gradientClass="bg-[#198A9E]"
        sites={sites}
        selectedSiteId={siteId}
        onSiteChange={id => navigate(`/portal/services?site=${id}`)}
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#198A9E] hover:bg-[#156F80] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Agregar servicio
          </button>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-[#25B3CC]/30 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{editId ? 'Editar servicio' : 'Nuevo servicio'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre *</label>
              <input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio (COP)</label>
                <input className={inputCls} type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de cobro</label>
                <select className={selectCls} value={form.charge_type} onChange={e => setF('charge_type', e.target.value)}>
                  {CHARGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Capacidad</label>
                <input className={inputCls} type="number" value={form.capacity} onChange={e => setF('capacity', e.target.value)} placeholder="Ej. 10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duración (min)</label>
                <input className={inputCls} type="number" value={form.duration} onChange={e => setF('duration', e.target.value)} placeholder="Ej. 60" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setF('description', e.target.value)} maxLength={300} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Imagen</label>
              <label className={`flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#25B3CC]/50 transition-colors text-sm text-gray-500 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#25B3CC]" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Subiendo…' : form.image_urls.length > 0 ? `${form.image_urls.length} imagen(es)` : 'Agregar imagen'}
                <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
              </label>
            </div>
            {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-red-600 text-sm">{error}</p></div>}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-[#25B3CC] hover:bg-[#1E9DB5] text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Enviando…' : 'Enviar a revisión'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#25B3CC] animate-spin" /></div>
        ) : services.length === 0 && !showForm ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No tienes servicios activos.</p>
            <button onClick={openAdd} className="mt-3 text-[#25B3CC] text-sm font-medium hover:text-[#1E9DB5]">+ Agregar servicio</button>
          </div>
        ) : (
          services.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                {s.price != null && <p className="text-gray-500 text-xs mt-0.5">${s.price.toLocaleString()} — {PRICING_TO_CHARGE[s.pricing_type] ?? s.pricing_type}</p>}
                {s.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{s.description}</p>}
                {pendingIds.has(s.id) && <div className="flex items-center gap-1 mt-1.5"><Clock className="w-3 h-3 text-yellow-500" /><span className="text-yellow-600 text-xs">Cambio en revisión</span></div>}
              </div>
              {confirmDel === s.id ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-600">¿Eliminar?</span>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-600 font-semibold hover:text-red-700">Sí</button>
                  <button onClick={() => setConfirmDel(null)} className="text-xs text-gray-500 hover:text-gray-700">No</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-[#25B3CC] transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmDel(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
