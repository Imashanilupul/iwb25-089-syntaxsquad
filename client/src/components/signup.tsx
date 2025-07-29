import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

import Image from "next/image"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Image */}
      <div className="lg:w-1/2 w-full h-64 lg:h-screen relative">
        <Image
          src="/images/gov.jpg"
          alt="Sign up illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Sign up form */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600">Join us today and get started</p>
          </div>

          <form className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input id="firstName" name="firstName" type="text" placeholder="John" required className="w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input id="lastName" name="lastName" type="text" placeholder="Doe" required className="w-full" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                required
                className="w-full"
              />
            </div>

            {/* NIC Number and Mobile Number (side by side on desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nic" className="text-sm font-medium text-gray-700">
                  NIC Number
                </Label>
                <Input id="nic" name="nic" type="text" placeholder="123456789V" required className="w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                  Mobile Number
                </Label>
                <Input id="mobile" name="mobile" type="tel" placeholder="+94 77 123 4567" required className="w-full" />
              </div>
            </div>

            {/* Password fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Re-enter Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox id="terms" required className="mt-1" />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Sign up button */}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium">
              Sign Up
            </Button>
          </form>

          {/* Login link */}
          {/* <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
                Sign in here
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}
