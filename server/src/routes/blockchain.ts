import { Router, Request, Response } from "express"

const router: Router = Router()

// GET /api/blockchain/blocks
router.get("/blocks", (req, res) => {
  res.json({
    success: true,
    message: "Blockchain blocks endpoint - to be implemented",
  })
})

// GET /api/blockchain/verify
router.get("/verify", (req, res) => {
  res.json({
    success: true,
    message: "Blockchain verification endpoint - to be implemented",
  })
})

export default router
