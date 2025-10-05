const express = require("express");
const petitionRouter = require("./petition");
const authRouter = require("./auth");
const reportsRouter = require("./reports");
const policyRouter = require("./policy");
const proposalsRouter = require("./proposals");
const projectRouter = require("./project");
const blockchainSyncRouter = require("./blockchain-sync");
const { router: jobManagerRouter } = require("./job-manager");

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Mount ALL routes only under /web3
const api = express.Router();
api.use("/petition", petitionRouter);
api.use("/auth", authRouter);
api.use("/report", reportsRouter);
api.use("/policy", policyRouter);
api.use("/proposal", proposalsRouter);
api.use("/project", projectRouter);
// Job manager and blockchain sync under the /web3 base as well
api.use('/', jobManagerRouter);
api.use('/', blockchainSyncRouter);
// Attach the API router at /web3
app.use('/web3', api);



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Web3 Service running at http://localhost:${PORT}/web3`);
});