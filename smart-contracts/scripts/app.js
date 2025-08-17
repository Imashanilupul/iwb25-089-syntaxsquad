const express = require("express");
const petitionRouter = require("./petition");
const authRouter = require("./auth");
const reportsRouter = require("./reports");
const policyRouter = require("./policy");
const proposalsRouter = require("./proposals");
const projectRouter=require("./project")

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

// Mount routers
app.use("/petition", petitionRouter);
app.use("/auth", authRouter);
app.use("/report", reportsRouter);
app.use("/policy", policyRouter);
app.use("/proposal", proposalsRouter);
app.use("/project", projectRouter);



const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Web3 Service running at http://localhost:${PORT}`);
});