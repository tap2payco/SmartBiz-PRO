import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import { projects, projectTasks } from '@smartbiz/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Variables = {
    user: any;
    profile: any;
    organizationId: string;
};

const app = new Hono<{ Variables: Variables }>();

const createProjectSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('ACTIVE'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const createTaskSchema = z.object({
    title: z.string().min(2).max(255),
    description: z.string().optional(),
    status: z.string().default('PENDING'),
    dueDate: z.string().optional(),
    assignedTo: z.string().uuid().optional(),
});

// List Projects
app.get('/', async (c) => {
    const orgId = c.get('organizationId');
    if (!orgId) return c.json({ error: 'Unauthorized' }, 401);

    const result = await db.query.projects.findMany({
        where: eq(projects.organizationId, orgId),
        with: {
            tasks: {
                with: {
                    assignee: true
                }
            }
        },
        orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
    });

    return c.json({ projects: result });
});

// Create Project
app.post('/', zValidator('json', createProjectSchema), async (c) => {
    const orgId = c.get('organizationId');
    if (!orgId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    const [newProject] = await db.insert(projects).values({
        ...data,
        organizationId: orgId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
    } as any).returning();

    return c.json({ project: newProject }, 201);
});

// Get Project
app.get('/:id', async (c) => {
    const orgId = c.get('organizationId');
    const id = c.req.param('id');
    if (!orgId) return c.json({ error: 'Unauthorized' }, 401);

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, id), eq(projects.organizationId, orgId)),
        with: {
            tasks: {
                with: {
                    assignee: true
                }
            }
        }
    });

    if (!project) return c.json({ error: 'Project not found' }, 404);
    return c.json({ project });
});

// Create Task
app.post('/:id/tasks', zValidator('json', createTaskSchema), async (c) => {
    const orgId = c.get('organizationId');
    const projectId = c.req.param('id');
    if (!orgId) return c.json({ error: 'Unauthorized' }, 401);

    // Verify project ownership
    const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, projectId), eq(projects.organizationId, orgId)),
    });

    if (!project) return c.json({ error: 'Project not found' }, 404);

    const data = c.req.valid('json');
    const [newTask] = await db.insert(projectTasks).values({
        ...data,
        projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
    } as any).returning();

    return c.json({ task: newTask }, 201);
});

// Update Task
app.patch('/tasks/:taskId', zValidator('json', createTaskSchema.partial()), async (c) => {
    const orgId = c.get('organizationId');
    const taskId = c.req.param('taskId');
    if (!orgId) return c.json({ error: 'Unauthorized' }, 401);

    // Verify task belongs to organization
    const task = await db.query.projectTasks.findFirst({
        where: eq(projectTasks.id, taskId),
        with: {
            project: true
        }
    });

    if (!task || task.project.organizationId !== orgId) {
        return c.json({ error: 'Task not found' }, 404);
    }

    const data = c.req.valid('json');
    const [updated] = await db.update(projectTasks)
        .set({
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            updatedAt: new Date()
        })
        .where(eq(projectTasks.id, taskId))
        .returning();

    return c.json({ task: updated });
});

// Delete Task
app.delete('/tasks/:taskId', async (c) => {
    const orgId = c.get('organizationId');
    const taskId = c.req.param('taskId');
    if (!orgId) return c.json({ error: 'Unauthorized' }, 401);

    const task = await db.query.projectTasks.findFirst({
        where: eq(projectTasks.id, taskId),
        with: {
            project: true
        }
    });

    if (!task || task.project.organizationId !== orgId) {
        return c.json({ error: 'Task not found' }, 404);
    }

    await db.delete(projectTasks).where(eq(projectTasks.id, taskId));
    return c.json({ success: true });
});

export default app;
