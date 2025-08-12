"use client"

import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MinistryInputProps {
  value: string
  onChange: (value: string) => void
  ministries: string[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function MinistryInput({
  value,
  onChange,
  ministries,
  placeholder = "Type or select ministry...",
  disabled = false,
  required = false
}: MinistryInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredMinistries, setFilteredMinistries] = useState<string[]>(ministries)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter ministries based on input
  useEffect(() => {
    if (!value || value.trim() === "") {
      setFilteredMinistries(ministries)
    } else {
      const filtered = ministries.filter(ministry =>
        ministry.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredMinistries(filtered)
    }
    setHighlightedIndex(-1)
  }, [value, ministries])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  // Handle ministry selection
  const handleMinistrySelect = (ministry: string) => {
    onChange(ministry)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredMinistries.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredMinistries.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredMinistries.length) {
          handleMinistrySelect(filteredMinistries[highlightedIndex])
        } else if (filteredMinistries.length === 1) {
          handleMinistrySelect(filteredMinistries[0])
        }
        break
      case "Escape":
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case "Tab":
        setIsOpen(false)
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Clear input
  const handleClear = () => {
    onChange("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="pr-16"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul ref={listRef} className="py-1">
            {filteredMinistries.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                {value ? `No ministries found for "${value}"` : "No ministries available"}
              </li>
            ) : (
              <>
                {filteredMinistries.map((ministry, index) => (
                  <li
                    key={ministry}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                      index === highlightedIndex && "bg-gray-100",
                      ministry === value && "bg-blue-50 text-blue-600"
                    )}
                    onClick={() => handleMinistrySelect(ministry)}
                  >
                    {ministry}
                  </li>
                ))}
                {value && 
                 value.trim() !== "" && 
                 !ministries.some(ministry => ministry.toLowerCase() === value.toLowerCase()) && (
                  <li className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 text-blue-600"
                      onClick={() => handleMinistrySelect(value)}
                    >
                      <span className="font-medium">Add new:</span> "{value}"
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
