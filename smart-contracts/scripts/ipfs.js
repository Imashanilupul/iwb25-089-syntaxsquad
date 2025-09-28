const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("buffer");

// Load API keys and gateway from environment variables (fall back to embedded values if not provided)
const PINATA_API_KEY = process.env.PINATA_API_KEY ;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;

async function uploadDescriptionToPinata(text) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const formData = new FormData();
  const buffer = Buffer.from(text, "utf-8");
  formData.append("file", buffer, "description.txt");

  try {
    const res = await axios.post(url, formData, {
      // allow large payloads
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    return res.data.IpfsHash;
  } catch (error) {
  console.error("❌ Error uploading to Pinata:", error.response?.data || error.message);
    throw error;
  }
}

// Helper function to add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFromPinata(cid, retries = 2, baseDelay = 200) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Much shorter delays for bulk operations - only retry delays
      if (attempt > 0) {
        const delayMs = baseDelay * (attempt + 1) + Math.random() * 100;
        await delay(delayMs);
      }

      const url = `${PINATA_GATEWAY_URL}${cid}`;
      const response = await axios.get(url, { timeout: 8000 }); // Shorter timeout for speed
      return response.data;
    } catch (error) {
      // Handle rate limiting - shorter backoff for bulk ops
      if (error.response?.status === 429) {
        if (attempt < retries - 1) {
          const backoffDelay = 300 + Math.random() * 200; // Much shorter backoff
          await delay(backoffDelay);
          continue;
        } else {
          throw new Error(`PINATA_RATE_LIMITED: ${cid}`);
        }
      }
      
      // Quick retry for other errors
      if (error.response?.status && attempt < retries - 1) {
        continue;
      } else if (error.response?.status) {
        throw new Error(`IPFS_HTTP_ERROR_${error.response.status}: ${cid}`);
      }
      
      // Quick retry for network errors
      if (attempt < retries - 1) {
        continue;
      } else {
        throw new Error(`IPFS_NETWORK_ERROR: ${cid}`);
      }
    }
  }
}
module.exports = { uploadDescriptionToPinata, getFromPinata };