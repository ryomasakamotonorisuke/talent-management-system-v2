'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trainee } from '@/types'
import TraineeSearch from './TraineeSearch'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface TraineeListProps {
  initialTrainees: Trainee[]
}

export default function TraineeList({ initialTrainees }: TraineeListProps) {
  const [filteredTrainees, setFilteredTrainees] = useState<Trainee[]>(initialTrainees)

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/trainees/export')
      if (!response.ok) {
        throw new Error('CSV出力に失敗しました')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trainees_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('CSV出力中にエラーが発生しました')
      console.error(error)
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/trainees/export-excel')
      if (!response.ok) {
        throw new Error('Excel出力に失敗しました')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trainees_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Excel出力中にエラーが発生しました')
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルタ */}
      <TraineeSearch 
        trainees={initialTrainees} 
        onFilterChange={setFilteredTrainees} 
      />

      {/* アクションバー */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-primary-600">
            <span className="font-medium text-primary-900">{filteredTrainees.length}</span>件表示
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleExportCSV}
              variant="secondary"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV出力
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="secondary"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel出力
            </Button>
            <Button
              href="/dashboard/trainees/new"
              variant="primary"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規登録
            </Button>
          </div>
        </div>
      </Card>

      {/* 実習生リスト */}
      <Card className="overflow-hidden">
        {filteredTrainees.length > 0 ? (
          <ul className="divide-y divide-primary-100">
            {filteredTrainees.map((trainee, index) => (
              <li 
                key={trainee.id} 
                className="hover:bg-primary-50 transition-colors duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Link href={`/dashboard/trainees/${trainee.id}`}>
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl font-bold">
                              {trainee.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-primary-900">
                              {trainee.last_name} {trainee.first_name}
                            </h3>
                            {trainee.last_name_kana && trainee.first_name_kana && (
                              <span className="text-sm text-primary-500">
                                ({trainee.last_name_kana} {trainee.first_name_kana})
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-primary-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              ID: {trainee.trainee_id}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                              {trainee.nationality}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {trainee.department}
                            </span>
                            {trainee.position && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {trainee.position}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-6 w-6 text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-16 text-center">
            <svg
              className="mx-auto h-16 w-16 text-primary-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-primary-900">実習生が見つかりません</h3>
            <p className="mt-2 text-sm text-primary-500">
              検索条件を変更してみてください
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
