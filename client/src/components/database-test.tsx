"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:8080'

export function DatabaseTest() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>("")

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE}/api/users`)
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data || [])
        setTestResult(`✅ Successfully fetched ${data.count || 0} users`)
      } else {
        setTestResult(`❌ Failed to fetch users: ${data.message}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testUserCreation = async () => {
    setLoading(true)
    try {
      const testUser = {
        user_name: `Frontend Test ${Date.now()}`,
        email: `frontend${Date.now()}@test.com`,
        nic: `19991234567${Math.floor(Math.random() * 10)}`,
        mobile_no: '0771234567',
        evm: '0x1234567890123456789012345678901234567890'
      }

      console.log('Creating test user:', testUser)

      const response = await fetch(`${BACKEND_API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResult(`✅ User created successfully! ID: ${data.data?.id}`)
        // Refresh users list
        await fetchUsers()
      } else {
        setTestResult(`❌ Failed to create user: ${data.message}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Error creating user: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testBackendHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE}/api/health`)
      const data = await response.text()
      
      if (response.ok) {
        setTestResult(`✅ Backend health check passed: ${data}`)
      } else {
        setTestResult(`❌ Backend health check failed: ${response.status}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Backend connection error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Database Test Panel</h2>
      
      {/* Test Buttons */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={testBackendHealth} 
          disabled={loading}
          variant="outline"
        >
          {loading ? "Testing..." : "Test Backend Health"}
        </Button>
        <Button 
          onClick={fetchUsers} 
          disabled={loading}
          variant="outline"
        >
          {loading ? "Loading..." : "Fetch Users"}
        </Button>
        <Button 
          onClick={testUserCreation} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? "Creating..." : "Test User Creation"}
        </Button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className="mb-6 p-4 rounded-lg bg-gray-100 border">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <p className="text-sm">{testResult}</p>
        </div>
      )}

      {/* Users Table */}
      {users.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Users in Database ({users.length})</h3>
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">NIC</th>
                <th className="border p-2 text-left">Mobile</th>
                <th className="border p-2 text-left">Wallet</th>
                <th className="border p-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-2">{user.id}</td>
                  <td className="border p-2">{user.user_name}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.nic}</td>
                  <td className="border p-2">{user.mobile_no}</td>
                  <td className="border p-2" title={user.evm}>
                    {user.evm ? `${user.evm.slice(0, 10)}...` : 'None'}
                  </td>
                  <td className="border p-2">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length > 10 && (
            <p className="text-sm text-gray-600 mt-2">Showing first 10 users of {users.length} total</p>
          )}
        </div>
      )}

      {/* Backend Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Backend Configuration:</h3>
        <p className="text-sm text-blue-700">API Base URL: {BACKEND_API_BASE}</p>
        <p className="text-sm text-blue-700">Expected Server: Ballerina backend on port 8080</p>
      </div>
    </div>
  )
}
