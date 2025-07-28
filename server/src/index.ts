import express, { Express } from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { errorHandler } from "./middleware/errorHandler"
import { logger } from "./utils/logger"
import authRoutes from "./routes/auth"
import userRoutes from "./routes/users"
import votingRoutes from "./routes/voting"
import spendingRoutes from "./routes/spending"
import blockchainRoutes from "./routes/blockchain"

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  })
  next()
})

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/voting", votingRoutes)
app.use("/api/spending", spendingRoutes)
app.use("/api/blockchain", blockchainRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📱 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`)
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
})

export default app
