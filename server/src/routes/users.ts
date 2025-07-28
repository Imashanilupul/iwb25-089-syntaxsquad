import { Router, Request, Response } from "express"

const router: Router = Router()

// GET /api/users/profile
router.get("/profile", (req, res) => {
  res.json({
    success: true,
    message: "User profile endpoint - to be implemented",
  })
})

// GET /api/users
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Get users endpoint - to be implemented",
  })
})

export default router
