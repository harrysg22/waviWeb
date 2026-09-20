import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface BusinessSiteData {
  accountId:   number
  companyId:   number
  siteId:      number
  name:        string
  description: string
  address:     string
  details:     string
  logoUrl:     string | null
  meanPrice:   number | null
  zoneId:      number | null
  locationLat: number | null
  locationLng: number | null
}

export function useBusinessSites(authId: string | null) {
  const [sites,   setSites]   = useState<BusinessSiteData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authId) { setLoading(false); return }

    ;(async () => {
      const { data: acc } = await supabase
        .from('account').select('id').eq('auth_id', authId).single()
      if (!acc) { setLoading(false); return }

      const { data: companies } = await supabase
        .from('company').select('id, name, description').eq('account_id', acc.id)
      if (!companies || companies.length === 0) { setLoading(false); return }

      const siteResults = await Promise.all(
        companies.map(co =>
          supabase.from('site')
            .select('id, name, address, details, logo_url, mean_price, zone_id, location_lat, location_lng')
            .eq('company_id', co.id)
            .limit(1)
            .maybeSingle()
        )
      )

      const result: BusinessSiteData[] = []
      companies.forEach((co, i) => {
        const si = siteResults[i].data
        if (si) {
          result.push({
            accountId:   acc.id,
            companyId:   co.id,
            siteId:      si.id,
            name:        si.name,
            description: co.description ?? '',
            address:     si.address,
            details:     si.details ?? '',
            logoUrl:     si.logo_url,
            meanPrice:   si.mean_price,
            zoneId:      si.zone_id,
            locationLat: si.location_lat,
            locationLng: si.location_lng,
          })
        }
      })

      setSites(result)
      setLoading(false)
    })()
  }, [authId])

  return { sites, loading }
}

// Kept for backwards compatibility — wraps useBusinessSites and returns first site
export function useBusinessSite(authId: string | null) {
  const { sites, loading } = useBusinessSites(authId)
  return {
    site:    sites[0] ?? null,
    loading,
    error:   null,
  }
}
