// ============================================
// utils/shiftHelper.js - Shift Calculation
// ============================================

export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export const calculateCheckInStatus = (
  checkInTime,
  shiftStartTime,
  lateToleranceMinutes
) => {
  const checkInMinutes = timeToMinutes(checkInTime);
  const shiftStartMinutes = timeToMinutes(shiftStartTime);
  const lateBoundaryMinutes = shiftStartMinutes + lateToleranceMinutes;

  if (checkInMinutes < shiftStartMinutes) {
    return {
      status: "EARLY",
      isLate: false,
      minutesEarly: shiftStartMinutes - checkInMinutes,
    };
  } else if (checkInMinutes <= lateBoundaryMinutes) {
    return {
      status: "PRESENT",
      isLate: false,
      minutesLate: checkInMinutes - shiftStartMinutes,
    };
  } else {
    return {
      status: "LATE",
      isLate: true,
      minutesLate: checkInMinutes - lateBoundaryMinutes,
    };
  }
};

export const calculateCheckOutStatus = (
  checkOutTime,
  shiftEndTime,
  earlyOutToleranceMinutes
) => {
  const checkOutMinutes = timeToMinutes(checkOutTime);
  const shiftEndMinutes = timeToMinutes(shiftEndTime);
  const earlyOutBoundaryMinutes = shiftEndMinutes - earlyOutToleranceMinutes;

  if (checkOutMinutes < earlyOutBoundaryMinutes) {
    return {
      status: "EARLY_OUT",
      isEarlyOut: true,
      minutesEarlyOut: earlyOutBoundaryMinutes - checkOutMinutes,
    };
  } else if (checkOutMinutes <= shiftEndMinutes + earlyOutToleranceMinutes) {
    return {
      status: "PRESENT", // On-time check-out
      isEarlyOut: false,
      minutesLate: Math.max(0, checkOutMinutes - shiftEndMinutes),
    };
  } else {
    // Overtime
    const overtimeMinutes = checkOutMinutes - shiftEndMinutes;
    return {
      status: "OVERTIME",
      isEarlyOut: false,
      overtimeMinutes,
    };
  }
};

export const getShiftInfo = (shift) => {
  return {
    shiftId: shift.id,
    shiftName: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    lateToleranceMinutes: shift.lateToleranceMinutes,
    earlyOutToleranceMinutes: shift.earlyOutToleranceMinutes,
    lateBoundary: calculateLateBoundary(
      shift.startTime,
      shift.lateToleranceMinutes
    ),
  };
};

export const calculateLateBoundary = (startTime, toleranceMinutes) => {
  const startMin = timeToMinutes(startTime);
  const boundaryMin = startMin + toleranceMinutes;
  const hours = Math.floor(boundaryMin / 60);
  const minutes = boundaryMin % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};
