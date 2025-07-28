import { errorHandler } from "./src/middleware/errorHandler"
import { logger } from "./src/utils/logger"
import authRoutes from "./src/routes/auth"

console.log("Imports working:", typeof errorHandler, typeof logger, typeof authRoutes)
