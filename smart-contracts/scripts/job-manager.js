const express = require("express");
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// BigInt serialization helper
function serializeBigInt(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// Helper to safely stringify objects with BigInt
function safeStringify(obj) {
  return JSON.stringify(obj, serializeBigInt);
}

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();
const jobResults = new Map();

// Job status enum
const JobStatus = {
  PENDING: 'pending',
  RUNNING: 'running', 
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Job types
const JobType = {
  BLOCKCHAIN_SYNC: 'blockchain_sync',
  PROPOSALS_SYNC: 'proposals_sync',
  PETITIONS_SYNC: 'petitions_sync',
  REPORTS_SYNC: 'reports_sync'
};

// Create a new job
function createJob(type, params = {}) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    type,
    status: JobStatus.PENDING,
    params,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    progress: 0,
    message: 'Job created',
    result: null,
    error: null
  };
  
  jobs.set(jobId, job);
  console.log(`📝 Created job ${jobId} of type ${type}`);
  return jobId;
}

// Update job status
function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) return false;
  
  Object.assign(job, updates);
  jobs.set(jobId, job);
  
  // Log progress updates
  if (updates.progress !== undefined || updates.message) {
    console.log(`🔄 Job ${jobId}: ${job.progress}% - ${job.message}`);
  }
  
  return true;
}

// Get job status
function getJob(jobId) {
  return jobs.get(jobId);
}

// Mark job as completed and store result
function completeJob(jobId, result) {
  const job = jobs.get(jobId);
  if (!job) return false;
  
  // Serialize BigInt values in result
  const serializedResult = JSON.parse(safeStringify(result));
  
  updateJob(jobId, {
    status: JobStatus.COMPLETED,
    completedAt: new Date().toISOString(),
    progress: 100,
    message: 'Job completed successfully',
    result: serializedResult
  });
  
  // Store result separately for easy retrieval
  jobResults.set(jobId, serializedResult);
  console.log(`✅ Job ${jobId} completed successfully`);
  return true;
}

// Mark job as failed
function failJob(jobId, error) {
  updateJob(jobId, {
    status: JobStatus.FAILED,
    completedAt: new Date().toISOString(),
    message: `Job failed: ${error.message}`,
    error: error.message
  });
  
  console.log(`❌ Job ${jobId} failed: ${error.message}`);
  return true;
}

// Start a job (this would typically be done by a worker process)
async function executeJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  updateJob(jobId, {
    status: JobStatus.RUNNING,
    startedAt: new Date().toISOString(),
    progress: 0,
    message: 'Job started'
  });
  
  try {
    switch (job.type) {
      case JobType.BLOCKCHAIN_SYNC:
        await executeBlockchainSyncJob(jobId, job.params);
        break;
      case JobType.PROPOSALS_SYNC:
        await executeProposalsSyncJob(jobId, job.params);
        break;
      case JobType.PETITIONS_SYNC:
        await executePetitionsSyncJob(jobId, job.params);
        break;
      case JobType.REPORTS_SYNC:
        await executeReportsSyncJob(jobId, job.params);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  } catch (error) {
    failJob(jobId, error);
  }
}

// Execute blockchain sync job
async function executeBlockchainSyncJob(jobId, params) {
  const { fetchAllBlockchainDataOptimized } = require('./blockchain-sync-optimized');
  
  updateJob(jobId, { progress: 10, message: 'Initializing blockchain sync...' });
  
  const blocksBack = params.blocksBack || 1000;
  
  updateJob(jobId, { progress: 20, message: `Fetching data for ${blocksBack} blocks...` });
  
  const result = await fetchAllBlockchainDataOptimized(blocksBack, (progress, message) => {
    updateJob(jobId, { progress: 20 + (progress * 0.7), message }); // Scale progress to 20-90%
  });
  
  updateJob(jobId, { progress: 95, message: 'Finalizing results...' });
  
  completeJob(jobId, result);
}

// Execute proposals sync job
async function executeProposalsSyncJob(jobId, params) {
  const { fetchProposalsOptimized } = require('./blockchain-sync-optimized');
  
  updateJob(jobId, { progress: 10, message: 'Starting proposals sync...' });
  
  const blocksBack = params.blocksBack || 1000;
  const result = await fetchProposalsOptimized(blocksBack);
  
  completeJob(jobId, { proposals: result });
}

// Execute petitions sync job
async function executePetitionsSyncJob(jobId, params) {
  const { fetchPetitionsOptimized } = require('./blockchain-sync-optimized');
  
  updateJob(jobId, { progress: 10, message: 'Starting petitions sync...' });
  
  const blocksBack = params.blocksBack || 1000;
  const result = await fetchPetitionsOptimized(blocksBack);
  
  completeJob(jobId, { petitions: result });
}

// Execute reports sync job
async function executeReportsSyncJob(jobId, params) {
  const { fetchReportsOptimized } = require('./blockchain-sync-optimized');
  
  updateJob(jobId, { progress: 10, message: 'Starting reports sync...' });
  
  const blocksBack = params.blocksBack || 1000;
  const result = await fetchReportsOptimized(blocksBack);
  
  completeJob(jobId, { reports: result });
}

// REST API Routes

// Create a new blockchain sync job
router.post('/jobs/blockchain-sync', async (req, res) => {
  try {
    const { blocksBack = 1000, isFullSync = false } = req.body;
    
    const jobId = createJob(JobType.BLOCKCHAIN_SYNC, { 
      blocksBack: isFullSync ? 999999 : blocksBack,
      isFullSync 
    });
    
    // Start the job asynchronously (don't wait)
    setImmediate(() => executeJob(jobId));
    
    res.json({
      success: true,
      jobId,
      message: 'Blockchain sync job started',
      statusUrl: `/jobs/${jobId}/status`
    });
  } catch (error) {
    console.error('Error creating blockchain sync job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create specific contract sync jobs
router.post('/jobs/proposals-sync', async (req, res) => {
  try {
    const { blocksBack = 1000 } = req.body;
    const jobId = createJob(JobType.PROPOSALS_SYNC, { blocksBack });
    
    setImmediate(() => executeJob(jobId));
    
    res.json({
      success: true,
      jobId,
      message: 'Proposals sync job started',
      statusUrl: `/jobs/${jobId}/status`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/jobs/petitions-sync', async (req, res) => {
  try {
    const { blocksBack = 1000 } = req.body;
    const jobId = createJob(JobType.PETITIONS_SYNC, { blocksBack });
    
    setImmediate(() => executeJob(jobId));
    
    res.json({
      success: true,
      jobId,
      message: 'Petitions sync job started',
      statusUrl: `/jobs/${jobId}/status`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/jobs/reports-sync', async (req, res) => {
  try {
    const { blocksBack = 1000 } = req.body;
    const jobId = createJob(JobType.REPORTS_SYNC, { blocksBack });
    
    setImmediate(() => executeJob(jobId));
    
    res.json({
      success: true,
      jobId,
      message: 'Reports sync job started',
      statusUrl: `/jobs/${jobId}/status`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get job status
router.get('/jobs/:jobId/status', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ 
      success: false, 
      error: 'Job not found' 
    });
  }
  
  res.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      message: job.message,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error
    }
  });
});

// Get job result (only for completed jobs)
router.get('/jobs/:jobId/result', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ 
      success: false, 
      error: 'Job not found' 
    });
  }
  
  if (job.status !== JobStatus.COMPLETED) {
    return res.status(400).json({ 
      success: false, 
      error: `Job is not completed. Status: ${job.status}` 
    });
  }
  
  const result = jobResults.get(jobId);
  
  // Use safe JSON response to handle any remaining BigInt issues
  res.setHeader('Content-Type', 'application/json');
  res.send(safeStringify({
    success: true,
    result,
    completedAt: job.completedAt
  }));
});

// List all jobs (with pagination)
router.get('/jobs', (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  
  let jobsList = Array.from(jobs.values());
  
  // Filter by status
  if (status) {
    jobsList = jobsList.filter(job => job.status === status);
  }
  
  // Filter by type
  if (type) {
    jobsList = jobsList.filter(job => job.type === type);
  }
  
  // Sort by creation time (newest first)
  jobsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedJobs = jobsList.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    jobs: paginatedJobs.map(job => ({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      message: job.message,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: jobsList.length,
      totalPages: Math.ceil(jobsList.length / limit)
    }
  });
});

// Delete a job and its result
router.delete('/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  const deleted = jobs.delete(jobId);
  jobResults.delete(jobId);
  
  if (deleted) {
    res.json({ success: true, message: 'Job deleted successfully' });
  } else {
    res.status(404).json({ success: false, error: 'Job not found' });
  }
});

// Clean up old completed jobs (older than 24 hours)
function cleanupOldJobs() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  for (const [jobId, job] of jobs.entries()) {
    if (job.status === JobStatus.COMPLETED && new Date(job.completedAt) < oneDayAgo) {
      jobs.delete(jobId);
      jobResults.delete(jobId);
      console.log(`🧹 Cleaned up old job ${jobId}`);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000);

module.exports = {
  router,
  createJob,
  updateJob,
  getJob,
  completeJob,
  failJob,
  executeJob,
  JobStatus,
  JobType
};
