import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export default function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  const inputStyles = `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
    error
      ? 'border-red-300 bg-red-50'
      : 'border-primary-300 bg-white hover:border-primary-400'
  } ${className}`
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-primary-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input className={inputStyles} {...props} />
      {error && (
        <p className="text-sm text-red-600 animate-fade-in">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-primary-500">{helperText}</p>
      )}
    </div>
  )
}









