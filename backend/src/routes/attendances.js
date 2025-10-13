import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.js";
import { isWithinRadius } from "../utils/geolocation.js";

const router = express.Router();
const prisma = new PrismaClient();

// Check in
router.post("/check-in", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, locationId } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined || !locationId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get location
    const location = await prisma.location.findUnique({
      where: { id: parseInt(locationId) },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Check if user is within radius
    const withinRadius = isWithinRadius(
      parseFloat(latitude),
      parseFloat(longitude),
      location.latitude,
      location.longitude,
      location.radiusMeter
    );

    if (!withinRadius) {
      return res.status(400).json({
        error: "You are outside the allowed check-in area",
        distanceInfo: "Please move closer to the store",
      });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today },
        checkInTime: { not: null },
      },
    });

    if (existingAttendance) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    // Create attendance record
    const now = new Date();
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        locationId: parseInt(locationId),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        checkInTime: now,
        status: "PRESENT",
        date: today,
      },
    });

    res.status(201).json({
      message: "Check-in successful",
      attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Check-in failed" });
  }
});

// Check out
router.post("/check-out", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    // Get today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today },
        checkInTime: { not: null },
      },
      orderBy: { checkInTime: "desc" },
    });

    if (!attendance) {
      return res.status(400).json({ error: "No check-in found for today" });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ error: "Already checked out" });
    }

    // Update with check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
      },
    });

    res.json({
      message: "Check-out successful",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Check-out failed" });
  }
});

// Get today's attendance
router.get("/today", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today },
      },
      include: { location: true },
    });

    if (!attendance) {
      return res.json({ message: "No attendance record for today", attendance: null });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's attendance" });
  }
});

// Get attendance history (user)
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    const where = { userId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { location: true },
      orderBy: { date: "desc" },
      take: parseInt(limit),
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

// Get all attendances (admin)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 50 } = req.query;

    const where = {};

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { user: true, location: true },
      orderBy: { date: "desc" },
      take: parseInt(limit),
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendances" });
  }
});

export default router;