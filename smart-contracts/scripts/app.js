const express = require("express");
const petitionRouter = require("./petition");
const authRouter = require("./auth");

const app = express();
app.use(express.json());

// Mount routers
// app.use("/petition", petitionRouter);
app.use("/auth", authRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Web3 Service running at http://localhost:${PORT}`);
});