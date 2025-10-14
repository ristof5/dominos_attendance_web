// ============================================
// routes/attendances.js - UPDATED
// ============================================

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.js";
import { isWithinRadius } from "../utils/geolocation.js";
import {
  calculateCheckInStatus,
  calculateCheckOutStatus,
  getShiftInfo,
} from "../utils/shiftHelper.js";

const router = express.Router();
const prisma = new PrismaClient();

// Check in WITH SHIFT LOGIC
router.post("/check-in", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, locationId } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined || !locationId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user with shift
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shift: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.shift) {
      return res.status(400).json({
        error: "User is not assigned to any shift. Contact admin.",
      });
    }

    // Get location
    const location = await prisma.location.findUnique({
      where: { id: parseInt(locationId) },
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Check if location is valid for this shift
    const shiftLocation = await prisma.shiftLocation.findUnique({
      where: {
        shiftId_locationId: {
          shiftId: user.shift.id,
          locationId: parseInt(locationId),
        },
      },
    });

    if (!shiftLocation) {
      return res.status(400).json({
        error: "This location is not assigned to your shift",
      });
    }

    // Check geolocation
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

    // Calculate check-in status based on shift
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const checkInResult = calculateCheckInStatus(
      currentTimeStr,
      user.shift.startTime,
      user.shift.lateToleranceMinutes
    );

    // Determine final status
    let finalStatus = checkInResult.status;

    // If more than tolerance, mark as LATE
    if (checkInResult.isLate) {
      finalStatus = "LATE";
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        locationId: parseInt(locationId),
        shiftId: user.shift.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        checkInTime: now,
        status: finalStatus,
        isLate: checkInResult.isLate,
        date: today,
      },
    });

    res.status(201).json({
      message: "Check-in successful",
      attendance,
      checkInInfo: {
        status: finalStatus,
        shiftStartTime: user.shift.startTime,
        currentTime: currentTimeStr,
        minutesLate: checkInResult.minutesLate || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Check-in failed" });
  }
});

// Check out WITH SHIFT LOGIC
router.post("/check-out", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    // Get user with shift
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shift: true },
    });

    if (!user || !user.shift) {
      return res.status(400).json({
        error: "User or shift not found",
      });
    }

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

    // Calculate check-out status based on shift
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const checkOutResult = calculateCheckOutStatus(
      currentTimeStr,
      user.shift.endTime,
      user.shift.earlyOutToleranceMinutes
    );

    // Determine final status
    let finalStatus = attendance.status; // Keep original check-in status

    // Update if there's early out or overtime
    if (checkOutResult.isEarlyOut) {
      finalStatus = "EARLY_OUT";
    } else if (checkOutResult.overtimeMinutes > 0) {
      finalStatus = "OVERTIME";
    }

    // Update with check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        status: finalStatus,
        isEarlyOut: checkOutResult.isEarlyOut,
        overtimeMinutes: checkOutResult.overtimeMinutes || 0,
      },
    });

    res.json({
      message: "Check-out successful",
      attendance: updatedAttendance,
      checkOutInfo: {
        status: finalStatus,
        shiftEndTime: user.shift.endTime,
        currentTime: currentTimeStr,
        overtimeMinutes: checkOutResult.overtimeMinutes || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Check-out failed" });
  }
});

// Get today's attendance (UNCHANGED, but shows shift info)
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
      include: {
        location: true,
        shift: true,
      },
    });

    if (!attendance) {
      // Get user's shift even if no attendance record
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { shift: true },
      });

      return res.json({
        message: "No attendance record for today",
        attendance: null,
        shift: user?.shift || null,
      });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch today's attendance" });
  }
});

// Get attendance history (UNCHANGED)
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
      include: {
        location: true,
        shift: true,
      },
      orderBy: { date: "desc" },
      take: parseInt(limit),
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

// Get all attendances (admin - UNCHANGED)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, userId, shiftId, limit = 50 } = req.query;

    const where = {};

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (shiftId) {
      where.shiftId = parseInt(shiftId);
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: true,
        location: true,
        shift: true,
      },
      orderBy: { date: "desc" },
      take: parseInt(limit),
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attendances" });
  }
});

export default router;
