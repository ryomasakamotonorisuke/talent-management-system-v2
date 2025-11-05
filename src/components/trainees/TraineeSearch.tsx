'use client'

import { useState, useEffect } from 'react'
import { Trainee } from '@/types'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface TraineeSearchProps {
  trainees: Trainee[]
  onFilterChange: (filtered: Trainee[]) => void
}

export default function TraineeSearch({ trainees, onFilterChange }: TraineeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNationality, setSelectedNationality] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // 国籍の一意なリスト
  const nationalities = Array.from(new Set(trainees.map(t => t.nationality))).sort()
  
  // 部署の一意なリスト
  const departments = Array.from(new Set(trainees.map(t => t.department))).sort()

  // 検索条件が変更されたときに自動フィルタリング
  useEffect(() => {
    let filtered = trainees

    // 名前検索
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.first_name.toLowerCase().includes(term) ||
        t.last_name.toLowerCase().includes(term) ||
        (t.first_name_kana && t.first_name_kana.toLowerCase().includes(term)) ||
        (t.last_name_kana && t.last_name_kana.toLowerCase().includes(term)) ||
        t.trainee_id.toLowerCase().includes(term)
      )
    }

    // 国籍フィルタ
    if (selectedNationality) {
      filtered = filtered.filter(t => t.nationality === selectedNationality)
    }

    // 部署フィルタ
    if (selectedDepartment) {
      filtered = filtered.filter(t => t.department === selectedDepartment)
    }

    onFilterChange(filtered)
  }, [searchTerm, selectedNationality, selectedDepartment, trainees, onFilterChange])

  const handleReset = () => {
    setSearchTerm('')
    setSelectedNationality('')
    setSelectedDepartment('')
  }

  return (
    <Card glow className="p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-900">検索・フィルタ</h3>
        {(searchTerm || selectedNationality || selectedDepartment) && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
          >
            リセット
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 検索ボックス */}
        <Input
          label="氏名・実習生ID検索"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="名前やIDで検索..."
        />

        {/* 国籍フィルタ */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary-700">
            国籍
          </label>
          <select
            value={selectedNationality}
            onChange={(e) => setSelectedNationality(e.target.value)}
            className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white hover:border-primary-400"
          >
            <option value="">すべて</option>
            {nationalities.map(nat => (
              <option key={nat} value={nat}>{nat}</option>
            ))}
          </select>
        </div>

        {/* 部署フィルタ */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary-700">
            部署
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white hover:border-primary-400"
          >
            <option value="">すべて</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  )
}
