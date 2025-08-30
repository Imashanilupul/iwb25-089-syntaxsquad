"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MinistryComboboxProps {
  value: string
  onValueChange: (value: string) => void
  ministries: string[]
  placeholder?: string
  disabled?: boolean
}

export function MinistryCombobox({
  value,
  onValueChange,
  ministries,
  placeholder = "Select ministry...",
  disabled = false,
}: MinistryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  // Update input value when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Filter ministries based on input
  const filteredMinistries = React.useMemo(() => {
    if (!inputValue.trim()) return ministries
    return ministries.filter((ministry) =>
      ministry.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [ministries, inputValue])

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue)
    onValueChange(selectedValue)
    setOpen(false)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onValueChange(newValue)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // When closing, if the input value is not in the list, still keep it
      onValueChange(inputValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && filteredMinistries.length === 0) {
      // User pressed Enter with a custom value that doesn't match existing ministries
      setOpen(false)
      onValueChange(inputValue.trim())
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {inputValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-[10002]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type ministry name..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            {filteredMinistries.length === 0 && inputValue && (
              <CommandEmpty>
                <div className="text-sm text-muted-foreground">
                  No matching ministries found.
                  <br />
                  <span className="text-xs">Press Enter to add "{inputValue}"</span>
                </div>
              </CommandEmpty>
            )}
            {filteredMinistries.length === 0 && !inputValue && (
              <CommandEmpty>
                <div className="text-sm text-muted-foreground">
                  Start typing to search or add a new ministry.
                </div>
              </CommandEmpty>
            )}
            {filteredMinistries.length > 0 && (
              <CommandGroup>
                {filteredMinistries.map((ministry) => (
                  <CommandItem
                    key={ministry}
                    value={ministry}
                    onSelect={() => handleSelect(ministry)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === ministry ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {ministry}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
