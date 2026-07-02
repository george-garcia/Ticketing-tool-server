import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────
export const ticketStatusEnum = pgEnum('ticket_status', [
  'Open',
  'Assigned',
  'Pending',
  'In progress',
  'Resolved',
  'Closed',
]);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['Minor', 'Major', 'Critical']);
export const ticketImpactEnum = pgEnum('ticket_impact', ['Low', 'Medium', 'High']);
export const ticketCategoryEnum = pgEnum('ticket_category', ['Incident', 'Problem', 'Major Incident']);
export const userRoleEnum = pgEnum('user_role', ['user', 'agent', 'admin']);

// ─── Users ───────────────────────────────────────────────────────────────────
// Profiles are keyed by the Cognito `sub`; credentials live in Cognito, never here.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  cognitoSub: varchar('cognito_sub', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull().default(''),
  lastName: varchar('last_name', { length: 100 }).notNull().default(''),
  role: userRoleEnum('role').notNull().default('user'),
  pictureUrl: text('picture_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Tickets ─────────────────────────────────────────────────────────────────
export const tickets = pgTable(
  'tickets',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    status: ticketStatusEnum('status').notNull().default('Open'),
    priority: ticketPriorityEnum('priority').notNull().default('Minor'),
    impact: ticketImpactEnum('impact').notNull().default('Low'),
    category: ticketCategoryEnum('category').notNull().default('Incident'),
    contact: varchar('contact', { length: 100 }),
    product: varchar('product', { length: 100 }),
    createdById: integer('created_by_id')
      .notNull()
      .references(() => users.id),
    assignedToId: integer('assigned_to_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('tickets_status_idx').on(t.status),
    assignedIdx: index('tickets_assigned_idx').on(t.assignedToId),
  }),
);

// ─── Comments ────────────────────────────────────────────────────────────────
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Ticket events (changelog) ─────────────────────────────────────────────────
// An append-only audit trail of field changes (status, priority, assignee, …) plus the
// initial "created" marker. Rendered alongside comments as a unified activity timeline.
export const ticketEvents = pgTable(
  'ticket_events',
  {
    id: serial('id').primaryKey(),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    // Null actor => system/seed. Set null on user delete so history survives.
    actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
    field: varchar('field', { length: 50 }).notNull(), // 'created' | 'status' | 'priority' | 'impact' | 'category' | 'assignee'
    fromValue: varchar('from_value', { length: 120 }),
    toValue: varchar('to_value', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ticketIdx: index('ticket_events_ticket_idx').on(t.ticketId),
  }),
);

// ─── Relations (for the Drizzle relational query API) ────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  createdTickets: many(tickets, { relationName: 'createdBy' }),
  assignedTickets: many(tickets, { relationName: 'assignedTo' }),
  comments: many(comments),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
    relationName: 'createdBy',
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  comments: many(comments),
  events: many(ticketEvents),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, { fields: [comments.ticketId], references: [tickets.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const ticketEventsRelations = relations(ticketEvents, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketEvents.ticketId], references: [tickets.id] }),
  actor: one(users, { fields: [ticketEvents.actorId], references: [users.id] }),
}));

// ─── Inferred types ──────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type TicketEvent = typeof ticketEvents.$inferSelect;
export type NewTicketEvent = typeof ticketEvents.$inferInsert;
