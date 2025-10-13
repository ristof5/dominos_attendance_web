// ============================================
// routes/locations.js
// ============================================

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all locations
router.get("/", authenticateToken, async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Create location (admin only)
router.post("/", authenticateToken, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { name, address, latitude, longitude, radiusMeter } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeter: radiusMeter || 100,
      },
    });

    res.status(201).json({
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create location" });
  }
});

// Update location (admin only)
router.put("/:id", authenticateToken, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, radiusMeter } = req.body;

    const location = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        name,
        address,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
        radiusMeter,
      },
    });

    res.json({ message: "Location updated successfully", location });
  } catch (error) {
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Delete location (admin only)
router.delete("/:id", authenticateToken, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete location" });
  }
});

export default router;