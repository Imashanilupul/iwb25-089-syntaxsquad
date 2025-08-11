"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  nicNumber: string
  mobileNumber: string
}

export function RegistrationDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    nicNumber: "",
    mobileNumber: "",
  })

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.nicNumber || !formData.mobileNumber) {
      alert("Please fill in all fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address")
      return
    }

    // NIC validation (basic - Sri Lankan NIC format)
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/
    if (!nicRegex.test(formData.nicNumber)) {
      alert("Please enter a valid NIC number")
      return
    }

    // Mobile number validation (Sri Lankan format)
    const mobileRegex = /^(\+94|0)?[0-9]{9}$/
    if (!mobileRegex.test(formData.mobileNumber)) {
      alert("Please enter a valid mobile number")
      return
    }

    console.log("Registration data:", formData)
    // Here you would typically send the data to your backend API
    
    // Reset form and close dialog
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      nicNumber: "",
      mobileNumber: "",
    })
    setOpen(false)
    alert("Registration successful!")
  }

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      nicNumber: "",
      mobileNumber: "",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 shadow-md transition-all duration-200 hover:from-blue-100 hover:to-green-100 hover:shadow-lg hover:scale-105"
        >
          <UserPlus className="h-4 w-4" />
          Register
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-amber-50 to-green-50">
        <DialogHeader>
          <DialogTitle className="text-blue-800">Citizen Registration</DialogTitle>
          <DialogDescription className="text-slate-600">
            Register to participate in Sri Lanka's transparent governance platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nicNumber">NIC Number</Label>
            <Input
              id="nicNumber"
              type="text"
              value={formData.nicNumber}
              onChange={(e) => handleInputChange("nicNumber", e.target.value)}
              placeholder="Enter NIC number (e.g., 123456789V or 123456789012)"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
              placeholder="Enter mobile number (e.g., 0771234567)"
              required
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Register</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
