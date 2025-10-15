// ============================================
// routes/shifts.js - Shift Management
// ============================================

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema
const shiftSchema = Joi.object({
  name: Joi.string().required(),
  startTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(), // HH:mm format
  endTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(),
  lateToleranceMinutes: Joi.number().default(30),
  earlyOutToleranceMinutes: Joi.number().default(30),
  isActive: Joi.boolean().default(true),
});

// Helper: Convert time string to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper: Convert minutes to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

// GET all shifts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shiftLocations: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    res.json(shifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
});

// GET single shift with details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shiftLocations: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shift" });
  }
});

// CREATE shift (admin only)
router.post(
  "/",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      const { error, value } = shiftSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Validate time logic
      const startMin = timeToMinutes(value.startTime);
      const endMin = timeToMinutes(value.endTime);

      if (startMin >= endMin) {
        return res.status(400).json({
          error: "Start time must be before end time",
        });
      }

      const shift = await prisma.shift.create({
        data: value,
        include: {
          shiftLocations: {
            include: { location: true },
          },
        },
      });

      res.status(201).json({
        message: "Shift created successfully",
        shift,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create shift" });
    }
  }
);

// UPDATE shift (admin only)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      const { error, value } = shiftSchema.validate(req.body, {
        presence: "optional",
      });
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Validate time logic if times are provided
      if (value.startTime && value.endTime) {
        const startMin = timeToMinutes(value.startTime);
        const endMin = timeToMinutes(value.endTime);

        if (startMin >= endMin) {
          return res.status(400).json({
            error: "Start time must be before end time",
          });
        }
      }

      const shift = await prisma.shift.update({
        where: { id: parseInt(req.params.id) },
        data: value,
        include: {
          shiftLocations: {
            include: { location: true },
          },
          employees: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        message: "Shift updated successfully",
        shift,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Shift not found" });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to update shift" });
    }
  }
);

// DELETE shift (admin only)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      await prisma.shift.delete({
        where: { id: parseInt(req.params.id) },
      });

      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Shift not found" });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to delete shift" });
    }
  }
);

// ============================================
// SHIFT LOCATION MANAGEMENT
// ============================================

// GET locations for a shift
router.get("/:shiftId/locations", authenticateToken, async (req, res) => {
  try {
    const locations = await prisma.shiftLocation.findMany({
      where: { shiftId: parseInt(req.params.shiftId) },
      include: { location: true },
    });

    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shift locations" });
  }
});

// ADD location to shift (admin only)
router.post(
  "/:shiftId/locations/:locationId",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      const locationId = parseInt(req.params.locationId);

      // Check if shift exists
      const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      // Check if location exists
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      // Check if already exists
      const existing = await prisma.shiftLocation.findUnique({
        where: {
          shiftId_locationId: {
            shiftId,
            locationId,
          },
        },
      });

      if (existing) {
        return res.status(400).json({
          error: "Location already assigned to this shift",
        });
      }

      const shiftLocation = await prisma.shiftLocation.create({
        data: {
          shiftId,
          locationId,
        },
        include: { location: true },
      });

      res.status(201).json({
        message: "Location added to shift successfully",
        shiftLocation,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add location to shift" });
    }
  }
);

// REMOVE location from shift (admin only)
router.delete(
  "/:shiftId/locations/:locationId",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      const locationId = parseInt(req.params.locationId);

      await prisma.shiftLocation.delete({
        where: {
          shiftId_locationId: {
            shiftId,
            locationId,
          },
        },
      });

      res.json({ message: "Location removed from shift successfully" });
    } catch (error) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ error: "Shift location mapping not found" });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to remove location from shift" });
    }
  }
);

// ============================================
// EMPLOYEE SHIFT ASSIGNMENT
// ============================================

// ASSIGN employee to shift (admin only)
router.post(
  "/:shiftId/assign/:userId",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      const shiftId = parseInt(req.params.shiftId);
      const userId = parseInt(req.params.userId);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { shiftId },
        include: { shift: true },
      });

      res.json({
        message: "Employee assigned to shift successfully",
        user,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "User not found" });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to assign employee to shift" });
    }
  }
);

// UNASSIGN employee from shift (admin only)
router.post(
  "/:shiftId/unassign/:userId",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { shiftId: null },
        include: { shift: true },
      });

      res.json({
        message: "Employee unassigned from shift successfully",
        user,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "User not found" });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to unassign employee from shift" });
    }
  }
);

// GET employees in a shift
router.get("/:shiftId/employees", authenticateToken, async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { shiftId: parseInt(req.params.shiftId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        shiftId: true,
      },
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shift employees" });
  }
});

export default router;
