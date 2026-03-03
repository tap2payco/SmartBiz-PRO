import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import { employees, leaveRequests, advances } from '@smartbiz/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono<{
  Variables: {
    userId: string;
    organizationId: string;
    role: string;
  };
}>();

app.use('*', authMiddleware as any);

// ==========================================
// EMPLOYEES
// ==========================================

const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().min(2),
  department: z.string().optional(),
  baseSalary: z.number().min(0),
});

app.get('/employees', async (c) => {
  const orgId = c.get('organizationId');
  const allEmployees = await db
    .select()
    .from(employees)
    .where(eq(employees.organizationId, orgId));

  return c.json(allEmployees);
});

app.post('/employees', zValidator('json', employeeSchema), async (c) => {
  const orgId = c.get('organizationId');
  const data = c.req.valid('json');

  const [employee] = await db
    .insert(employees)
    .values({
      organizationId: orgId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      department: data.department,
      baseSalary: data.baseSalary.toString(),
    })
    .returning();

  return c.json(employee, 201);
});

// ==========================================
// LEAVE REQUESTS
// ==========================================

const leaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string(), // ISO date
  endDate: z.string(),   // ISO date
  type: z.string(),
  reason: z.string().optional(),
});

app.get('/leave-requests', async (c) => {
  const orgId = c.get('organizationId');
  const requests = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.organizationId, orgId));

  return c.json(requests);
});

app.post('/leave-requests', zValidator('json', leaveRequestSchema), async (c) => {
  const orgId = c.get('organizationId');
  const data = c.req.valid('json');

  const [request] = await db
    .insert(leaveRequests)
    .values({
      organizationId: orgId,
      employeeId: data.employeeId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      type: data.type,
      reason: data.reason,
    })
    .returning();

  return c.json(request, 201);
});

app.patch('/leave-requests/:id/status', zValidator('json', z.object({ status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']) })), async (c) => {
  const orgId = c.get('organizationId');
  const id = c.req.param('id');
  const { status } = c.req.valid('json');

  const [request] = await db
    .update(leaveRequests)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)))
    .returning();

  if (!request) return c.json({ error: 'Leave request not found' }, 404);
  return c.json(request);
});

// ==========================================
// ADVANCES
// ==========================================

const advanceSchema = z.object({
  employeeId: z.string().uuid(),
  amount: z.number().min(1),
  reason: z.string().optional(),
});

app.get('/advances', async (c) => {
  const orgId = c.get('organizationId');
  const allAdvances = await db
    .select()
    .from(advances)
    .where(eq(advances.organizationId, orgId));

  return c.json(allAdvances);
});

app.post('/advances', zValidator('json', advanceSchema), async (c) => {
  const orgId = c.get('organizationId');
  const data = c.req.valid('json');

  const [advance] = await db
    .insert(advances)
    .values({
      organizationId: orgId,
      employeeId: data.employeeId,
      amount: data.amount.toString(),
      reason: data.reason,
    })
    .returning();

  return c.json(advance, 201);
});

export default app;
