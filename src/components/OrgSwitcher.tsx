'use client'

import { useEffect, useState } from 'react'

interface OrgSwitcherProps {
  onChange?: (orgId: string | null) => void
}

export default function OrgSwitcher({ onChange }: OrgSwitcherProps) {
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([])
  const [current, setCurrent] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrgs = async () => {
      const res = await fetch('/api/me/orgs')
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.orgs || [])
        const stored = localStorage.getItem('current_org_id')
        const first = stored || (data.orgs?.[0]?.id ?? null)
        setCurrent(first)
        if (onChange) onChange(first)
      }
    }
    fetchOrgs()
  }, [onChange])

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value || null
    setCurrent(val)
    if (val) localStorage.setItem('current_org_id', val)
    else localStorage.removeItem('current_org_id')
    if (onChange) onChange(val)
  }

  const hasOrgs = orgs.length > 0

  return (
    <div className="flex items-center space-x-2">
      <label className="text-xs text-gray-500">組織</label>
      <select
        value={current ?? ''}
        onChange={handleSelect}
        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 bg-white cursor-pointer z-50"
      >
        {(!current || !hasOrgs) && <option value="">選択してください</option>}
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  )
}


