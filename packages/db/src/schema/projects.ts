import { pgTable, uuid, text, timestamp, boolean, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './auth';
import { employees } from './hr';

// Project Status Enum
export const projectStatusEnum = pgEnum('project_status', ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']);

// Projects table
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('ACTIVE'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Project Tasks table
export const projectTasks = pgTable('project_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, IN_PROGRESS, COMPLETED
    dueDate: timestamp('due_date'),
    assignedTo: uuid('assigned_to').references(() => employees.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [projects.organizationId],
        references: [organizations.id],
    }),
    tasks: many(projectTasks),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
    project: one(projects, {
        fields: [projectTasks.projectId],
        references: [projects.id],
    }),
    assignee: one(employees, {
        fields: [projectTasks.assignedTo],
        references: [employees.id],
    }),
}));

// Types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type NewProjectTask = typeof projectTasks.$inferInsert;
