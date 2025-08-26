# Asynchronous Blockchain Sync System

This system implements an asynchronous job-based approach for blockchain synchronization to handle long-running operations without blocking the client.

## Architecture

```
Client → Ballerina → Node.js Job Manager → Blockchain
   ↓        ↓              ↓                    ↓
   ←        ←         Job Result ←              ←
```

## Flow

1. **Client Request**: Client sends sync request to Ballerina API
2. **Job Creation**: Ballerina forwards to Node.js job manager, gets job ID immediately
3. **Job Response**: Ballerina returns job ID to client (no waiting)
4. **Status Polling**: Client polls job status using the job ID
5. **Background Processing**: Node.js processes blockchain data in background
6. **Result Retrieval**: When complete, client gets the result using job ID

## Benefits

- ✅ **No Timeouts**: Client doesn't wait for long operations
- ✅ **Better UX**: Real-time progress updates via polling
- ✅ **Scalable**: Multiple jobs can run concurrently  
- ✅ **Resilient**: Jobs persist even if client disconnects
- ✅ **Progress Tracking**: Detailed progress and status information

## API Endpoints

### Start Sync Job
```http
POST /api/blockchain/sync
Content-Type: application/json

{
  "blocksBack": 1000,
  "isFullSync": false
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "message": "Blockchain sync job started",
  "statusUrl": "/api/blockchain/sync/status/{jobId}",
  "resultUrl": "/api/blockchain/sync/result/{jobId}"
}
```

### Check Job Status
```http
GET /api/blockchain/sync/status/{jobId}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid-here",
    "type": "blockchain_sync",
    "status": "running",
    "progress": 65,
    "message": "Processing proposals...",
    "createdAt": "2025-08-26T10:00:00Z",
    "startedAt": "2025-08-26T10:00:01Z"
  }
}
```

### Get Job Result
```http
GET /api/blockchain/sync/result/{jobId}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "proposals": [...],
    "petitions": [...],
    "reports": [...],
    "fromBlock": 100,
    "toBlock": 1100,
    "processingTime": 45000
  },
  "completedAt": "2025-08-26T10:05:00Z"
}
```

## Job Status Values

- `pending` - Job created but not started
- `running` - Job is actively processing
- `completed` - Job finished successfully
- `failed` - Job encountered an error

## Usage Examples

### JavaScript Client
```javascript
// Start sync job
const response = await fetch('/api/blockchain/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ blocksBack: 1000, isFullSync: false })
});

const { jobId } = await response.json();

// Poll status
const pollStatus = async () => {
  const statusRes = await fetch(`/api/blockchain/sync/status/${jobId}`);
  const { job } = await statusRes.json();
  
  console.log(`Progress: ${job.progress}% - ${job.message}`);
  
  if (job.status === 'completed') {
    // Get result
    const resultRes = await fetch(`/api/blockchain/sync/result/${jobId}`);
    const result = await resultRes.json();
    console.log('Sync completed:', result);
  } else if (job.status === 'running' || job.status === 'pending') {
    setTimeout(pollStatus, 2000); // Poll every 2 seconds
  } else if (job.status === 'failed') {
    console.error('Job failed:', job.error);
  }
};

setTimeout(pollStatus, 1000);
```

### React Hook
```tsx
import { useState } from 'react';

function useBlockchainSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const sync = async (blocksBack = 1000) => {
    setIsLoading(true);
    
    // Start job
    const jobRes = await fetch('/api/blockchain/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocksBack })
    });
    
    const { jobId } = await jobRes.json();
    
    // Poll status
    const pollStatus = async () => {
      const statusRes = await fetch(`/api/blockchain/sync/status/${jobId}`);
      const { job } = await statusRes.json();
      
      setProgress(job.progress);
      setStatus(job.message);
      
      if (job.status === 'completed') {
        const resultRes = await fetch(`/api/blockchain/sync/result/${jobId}`);
        const result = await resultRes.json();
        setIsLoading(false);
        return result;
      } else if (job.status === 'running') {
        setTimeout(pollStatus, 2000);
      } else if (job.status === 'failed') {
        setIsLoading(false);
        throw new Error(job.error);
      }
    };
    
    setTimeout(pollStatus, 1000);
  };

  return { sync, isLoading, progress, status };
}
```

## Implementation Files

- **Job Manager**: `smart-contracts/scripts/job-manager.js`
- **Optimized Sync**: `smart-contracts/scripts/blockchain-sync-optimized.js` 
- **Ballerina API**: `server/main.bal` (updated endpoints)
- **Client Utils**: `client/src/utils/async-blockchain-sync.ts`

## Configuration

### Timeouts
- Job execution timeout: 15 minutes per job
- Status polling interval: 2 seconds
- Client polling timeout: 10 minutes

### Cleanup
- Completed jobs are automatically cleaned up after 24 hours
- Failed jobs are kept for 24 hours for debugging

## Monitoring

### Job List
```http
GET /jobs?status=running&page=1&limit=20
```

### Job Deletion  
```http
DELETE /jobs/{jobId}
```

This async system provides a much better experience for long-running blockchain operations compared to the synchronous approach.
