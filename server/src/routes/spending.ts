import { Router, Request, Response } from "express"

const router: Router = Router()

// GET /api/spending/projects
router.get("/projects", (req, res) => {
  res.json({
    success: true,
    message: "Spending projects endpoint - to be implemented",
  })
})

// GET /api/spending/budget
router.get("/budget", (req, res) => {
  res.json({
    success: true,
    message: "Budget tracking endpoint - to be implemented",
  })
})

export default router
