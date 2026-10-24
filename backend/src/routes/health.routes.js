import { Router } from "express";
const router = Router();
router.get("/", (req, res) =>
  res.json({ ok: true, service: "formulab-api", mlConnected: false }),
);
export default router;
