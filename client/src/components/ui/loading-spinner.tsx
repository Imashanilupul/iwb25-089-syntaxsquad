"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 
        className={cn(
          "animate-spin text-blue-600",
          sizeClasses[size],
          className
        )} 
      />
      {text && (
        <p className="text-sm text-slate-600 animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Overlay version for full-screen loading
interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({ isVisible, text = "Loading...", className }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/20 backdrop-blur-sm",
      className
    )}>
      <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-blue-200">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  )
}

// Inline version for within components
interface LoadingStateProps {
  isLoading: boolean
  text?: string
  children: React.ReactNode
  className?: string
}

export function LoadingState({ isLoading, text, children, className }: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <LoadingSpinner size="lg" text={text} />
      </div>
    )
  }

  return <>{children}</>
}
