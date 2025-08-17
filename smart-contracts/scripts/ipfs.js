const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("buffer");

// Load API keys from environment variables
const PINATA_API_KEY = "12ad016cf769c3ca4480";
const PINATA_SECRET_API_KEY = "ebfefaf77f032697f3da449271ee30b3bd73dbbf2a79c21e449bbc4f07527f26";

async function uploadDescriptionToPinata(text) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const formData = new FormData();
  const buffer = Buffer.from(text, "utf-8");
  formData.append("file", buffer, "description.txt");

  try {
    const res = await axios.post(url, formData, {
      maxBodyLength: "Infinity",
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    console.log("✅ Uploaded to IPFS with CID:", res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (error) {
    console.error("❌ Error uploading to Pinata:", error.response?.data || error.message);
    throw error;
  }
}

async function getFromPinata(cid) {
  try {
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await axios.get(url);
    console.log("✅ Retrieved from IPFS:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error retrieving from Pinata:", error.response?.data || error.message);
    throw error;
  }
}

getFromPinata("Qmd3BftiZ81NniGXSjWViEFdaamAFyKV5PTLYnSDRDYFJN")

module.exports = { uploadDescriptionToPinata, getFromPinata };