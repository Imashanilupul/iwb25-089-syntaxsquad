// Example client implementation for async blockchain sync

const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

async function syncBlockchainAsync(blocksBack = 1000, isFullSync = false) {
  console.log('🚀 Starting async blockchain sync...');
  
  try {
    // Step 1: Start the sync job
    console.log('📤 Creating sync job...');
    const jobResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        blocksBack: isFullSync ? 999999 : blocksBack,
        isFullSync: isFullSync
      })
    });

    if (!jobResponse.ok) {
      throw new Error(`Failed to start sync job: ${jobResponse.statusText}`);
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.jobId;
    
    console.log(`✅ Job created with ID: ${jobId}`);
    console.log(`📊 Status URL: ${jobData.statusUrl}`);
    console.log(`📋 Result URL: ${jobData.resultUrl}`);

    // Step 2: Poll job status
    const pollInterval = 2000; // 2 seconds
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes max (300 * 2s = 600s)

    const pollStatus = async (): Promise<any> => {
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Job polling timeout after 10 minutes');
      }

      console.log(`🔄 Polling job status (attempt ${attempts}/${maxAttempts})...`);
      
      const statusResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync/status/${jobId}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to get job status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      const job = statusData.job;

      console.log(`📊 Job ${jobId}: ${job.status} (${job.progress}%) - ${job.message}`);

      if (job.status === 'completed') {
        return job; // Job completed successfully
      } else if (job.status === 'failed') {
        throw new Error(`Job failed: ${job.error || 'Unknown error'}`);
      } else if (job.status === 'running' || job.status === 'pending') {
        // Job still in progress - continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return pollStatus(); // Recursive call
      } else {
        throw new Error(`Unknown job status: ${job.status}`);
      }
    };

    // Wait for job completion
    const completedJob = await pollStatus();
    console.log('🎉 Job completed!', completedJob);

    // Step 3: Get job result
    console.log('📋 Getting job result...');
    const resultResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync/result/${jobId}`);
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to get job result: ${resultResponse.statusText}`);
    }

    const resultData = await resultResponse.json();
    console.log('✅ Sync completed successfully!', resultData);

    return {
      success: true,
      jobId: jobId,
      result: resultData.result,
      completedAt: resultData.completedAt
    };

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Usage examples:

// Sync last 1000 blocks
syncBlockchainAsync(1000, false)
  .then(result => console.log('Partial sync completed:', result))
  .catch(error => console.error('Partial sync failed:', error));

// Full sync (all blocks)
syncBlockchainAsync(0, true)
  .then(result => console.log('Full sync completed:', result))
  .catch(error => console.error('Full sync failed:', error));

// With async/await
async function example() {
  try {
    const result = await syncBlockchainAsync(500, false);
    console.log('Async sync result:', result);
    
    // Process the blockchain data
    const blockchainData = result.result;
    console.log('Proposals:', blockchainData.proposals?.length || 0);
    console.log('Petitions:', blockchainData.petitions?.length || 0);
    console.log('Reports:', blockchainData.reports?.length || 0);
    console.log('Processing time:', blockchainData.processingTime + 'ms');
    
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// React hook example for frontend
function useBlockchainSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sync = async (blocksBack = 1000, isFullSync = false) => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Start job
      setCurrentStep('Starting sync job...');
      setProgress(10);
      
      const jobResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocksBack, isFullSync })
      });

      const jobData = await jobResponse.json();
      const jobId = jobData.jobId;
      
      setCurrentStep(`Job started: ${jobId}`);
      setProgress(20);

      // Poll status
      const pollStatus = async () => {
        const statusResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync/status/${jobId}`);
        const statusData = await statusResponse.json();
        const job = statusData.job;

        setProgress(Math.max(20, job.progress || 0));
        setCurrentStep(job.message || `Job ${job.status}...`);

        if (job.status === 'completed') {
          // Get result
          setCurrentStep('Getting results...');
          setProgress(95);
          
          const resultResponse = await fetch(`${BALLERINA_BASE_URL}/api/blockchain/sync/result/${jobId}`);
          const resultData = await resultResponse.json();
          
          setResult(resultData);
          setProgress(100);
          setCurrentStep('Completed!');
        } else if (job.status === 'failed') {
          throw new Error(job.error || 'Job failed');
        } else if (job.status === 'running' || job.status === 'pending') {
          setTimeout(pollStatus, 2000);
        }
      };

      setTimeout(pollStatus, 1000);

    } catch (err) {
      setError(err.message);
      setCurrentStep('Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sync,
    isLoading,
    progress,
    currentStep,
    result,
    error
  };
}

export { syncBlockchainAsync, useBlockchainSync };
