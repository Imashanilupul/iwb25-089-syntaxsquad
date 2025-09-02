# Policy Management Integration

This document describes the integration between the React frontend Policy Management component and the Ballerina backend.

## Features Implemented

### Backend (Ballerina)
- ✅ Complete CRUD operations for policies
- ✅ Search policies by keyword
- ✅ Filter policies by status
- ✅ Filter policies by ministry
- ✅ Policy statistics
- ✅ Get active/draft policies
- ✅ Database integration with Supabase

### Frontend (React)
- ✅ Real-time data fetching from backend
- ✅ Create new policies
- ✅ Edit existing policies
- ✅ Delete policies (with confirmation)
- ✅ Advanced search and filtering
- ✅ Sorting by name, date, and ministry
- ✅ Statistics dashboard
- ✅ Loading states and error handling
- ✅ Toast notifications for user feedback

## API Endpoints

### Policy Endpoints
- `GET /api/policies` - Get all policies
- `POST /api/policies` - Create new policy
- `GET /api/policies/{id}` - Get policy by ID
- `PUT /api/policies/{id}` - Update policy
- `DELETE /api/policies/{id}` - Delete policy
- `GET /api/policies/search/{keyword}` - Search policies
- `GET /api/policies/status/{status}` - Filter by status
- `GET /api/policies/ministry/{ministry}` - Filter by ministry
- `GET /api/policies/statistics` - Get statistics
- `GET /api/policies/active` - Get active policies
- `GET /api/policies/draft` - Get draft policies

## Policy Data Structure

### Backend (Ballerina Database)
```ballerina
{
  "id": int,
  "name": string,
  "description": string,
  "view_full_policy": string,
  "ministry": string,
  "status": string, // DRAFT, UNDER_REVIEW, PUBLIC_CONSULTATION, APPROVED, ACTIVE, INACTIVE, ARCHIVED
  "created_time": string,
  "updated_at": string,
  "effective_date": string?
}
```

### Frontend (React TypeScript)
```typescript
interface Policy {
  id: number
  name: string
  description: string
  view_full_policy: string
  ministry: string
  status: string
  created_time: string
  updated_at?: string
  effective_date?: string
}
```

## How to Test

### 1. Start the Backend Server
```bash
cd server
bal run
```
The server will start on port 8080 (or configured port).

### 2. Start the Frontend
```bash
cd client
npm run dev
```
The frontend will start on port 3000.

### 3. Test Features

#### Basic CRUD Operations
1. **View Policies**: Navigate to Admin Dashboard → Policy Management
2. **Add Policy**: Click "Add Policy" button, fill form, submit
3. **Edit Policy**: Click edit button on any policy row
4. **Delete Policy**: Click delete button, confirm deletion
5. **View Policy Document**: Click eye button to open document URL

#### Search and Filtering
1. **Search**: Type in the search box to search by name or description
2. **Filter by Ministry**: Use ministry dropdown
3. **Filter by Status**: Use status dropdown
4. **Sort**: Use sort dropdowns for different ordering

#### Advanced Features
1. **Statistics**: View real-time statistics in dashboard cards
2. **Combined Filters**: Use search + ministry + status filters together
3. **Loading States**: Observe loading indicators during API calls
4. **Error Handling**: Test with invalid data or network issues

## Environment Configuration

### Backend
Configure in `server/Config.toml`:
```toml
port = 8080
petitionPort = 8081
supabaseUrl = "https://your-project.supabase.co"
supabaseServiceRoleKey = "your-service-role-key"
```

### Frontend
Configure in `client/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Data Flow

1. **Component Mount**: React component loads → calls `policyService.getAllPolicies()`
2. **API Call**: Service calls → `apiService.get('/api/policies')`
3. **Backend**: Main.bal routes to → `policiesService.getAllPolicies()`
4. **Database**: Service queries → Supabase via HTTP REST API
5. **Response**: Data flows back through the chain
6. **UI Update**: React state updates → component re-renders

## Status Mapping

The component handles status formatting between backend and frontend:

### Backend Statuses (Uppercase with underscores)
- `DRAFT`
- `UNDER_REVIEW`
- `PUBLIC_CONSULTATION`
- `APPROVED`
- `ACTIVE`
- `INACTIVE`
- `ARCHIVED`

### Frontend Display (Formatted)
- `Draft`
- `Under Review`
- `Public Consultation`
- `Approved`
- `Active`
- `Inactive`
- `Archived`

## Error Handling

The frontend includes comprehensive error handling:
- Network errors
- API validation errors
- User input validation
- Loading states
- Toast notifications for success/error messages

## Next Steps

1. **Policy Comments Integration**: Connect with policy comments service for real comment counts
2. **File Upload**: Add support for uploading policy documents
3. **Advanced Permissions**: Add role-based access control
4. **Audit Trail**: Track policy changes and history
5. **Notifications**: Add email/SMS notifications for policy updates
6. **Analytics**: Add detailed analytics and reporting

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure frontend URL is in backend CORS allowlist
2. **API Not Found**: Check server is running and endpoint URLs
3. **Database Connection**: Verify Supabase configuration
4. **TypeScript Errors**: Ensure all interfaces match API responses

### Debug Tips

1. Check browser console for errors
2. Monitor network tab for API calls
3. Check server logs for backend errors
4. Verify environment variables are set correctly
