import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ProtectedAdminRoute() {
  const [checking, setChecking] = useState(true)
  const [isAdmin,  setIsAdmin]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setChecking(false); return }

      const { data } = await supabase
        .from('account')
        .select('tipo')
        .eq('auth_id', session.user.id)
        .single()

      setIsAdmin(data?.tipo === 'admin')
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#25B3CC] animate-spin" />
      </div>
    )
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}
