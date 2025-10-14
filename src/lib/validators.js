import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional()
});

export const attendanceMarkSchema = z.object({
  date: z.string().min(1),
  records: z.array(z.object({
    memberId: z.number(),
    status: z.enum(["PRESENT","ABSENT"])
  }))
});

export const reportQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1)
});