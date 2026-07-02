import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import { tickets, users, comments, ticketEvents, teams, appSettings } from './schema';

/**
 * Demo seed — repeatable. Wipes tickets/comments/events, upserts a small cast of users, and
 * generates ~36 tickets spread across the last 14 days so the dashboard trend chart and
 * changelog have real data. Users are keyed by the dev-token `sub` (`dev-<email>`) so the
 * "Explore as demo recruiter" sign-in lands on a seeded agent with tickets already assigned.
 *
 * Run with: npm run db:seed   (requires DATABASE_URL and an applied schema)
 */

const DAY = 86_400_000;
const now = Date.now();

type Role = 'user' | 'agent' | 'admin';
const TEAM_NAMES = ['Network', 'Endpoint', 'Identity & Access'];

// The demo recruiter is an admin so the one-click demo shows the full app (admin area, settings).
const CAST: { email: string; firstName: string; lastName: string; role: Role; team?: string }[] = [
  { email: 'recruiter@demo.com', firstName: 'Demo', lastName: 'Recruiter', role: 'admin', team: 'Network' },
  { email: 'maya.chen@georgegarciadev.com', firstName: 'Maya', lastName: 'Chen', role: 'agent', team: 'Network' },
  { email: 'sam.okoro@georgegarciadev.com', firstName: 'Sam', lastName: 'Okoro', role: 'agent', team: 'Endpoint' },
  { email: 'priya.nair@georgegarciadev.com', firstName: 'Priya', lastName: 'Nair', role: 'admin', team: 'Identity & Access' },
  { email: 'lee.warren@georgegarciadev.com', firstName: 'Lee', lastName: 'Warren', role: 'user' },
  { email: 'jordan.diaz@georgegarciadev.com', firstName: 'Jordan', lastName: 'Diaz', role: 'user' },
];

const STATUSES = ['Open', 'Assigned', 'Pending', 'In progress', 'Resolved', 'Closed'] as const;
const PRIORITIES = ['Minor', 'Major', 'Critical'] as const;
const IMPACTS = ['Low', 'Medium', 'High'] as const;
const CATEGORIES = ['Incident', 'Problem', 'Major Incident'] as const;

const SUBJECTS: { title: string; description: string; product: string }[] = [
  { title: 'VPN drops every few minutes', description: 'Remote staff report the VPN disconnects roughly every 5 minutes, forcing re-auth.', product: 'GlobalProtect VPN' },
  { title: 'Outlook stuck on "Trying to connect"', description: 'Several users in Finance cannot send or receive mail since this morning.', product: 'Microsoft 365' },
  { title: 'Laptop will not boot after update', description: 'Blue screen on startup following the latest Windows feature update.', product: 'Dell Latitude 7440' },
  { title: 'Cannot access shared drive', description: 'The \\\\corp\\shared mapping fails with a permissions error for the whole Marketing team.', product: 'File Server' },
  { title: 'Printer on 3rd floor offline', description: 'The main MFP shows offline in the print queue; power-cycling did not help.', product: 'Canon imageRUNNER' },
  { title: 'Password reset not arriving', description: 'Self-service reset emails are not being delivered to external contractors.', product: 'Okta' },
  { title: 'CRM dashboard loads blank', description: 'Sales dashboard renders a white screen after login for Chrome users.', product: 'Salesforce' },
  { title: 'Two-factor prompt loops', description: 'MFA push approves but the login page keeps prompting again.', product: 'Duo Security' },
  { title: 'New hire needs accounts provisioned', description: 'Onboarding for a new analyst starting Monday — email, VPN, and CRM access.', product: 'Identity Platform' },
  { title: 'Slack notifications delayed', description: 'Messages arrive 10–15 minutes late across the engineering workspace.', product: 'Slack' },
  { title: 'Database backups failing overnight', description: 'The nightly job has errored three nights running with a disk-space warning.', product: 'PostgreSQL' },
  { title: 'Zoom audio cutting out', description: 'Audio drops intermittently during large all-hands calls.', product: 'Zoom' },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  // Clean slate for the demo data (order matters for FKs; events/comments cascade off tickets).
  await db.execute(sql`TRUNCATE TABLE ${ticketEvents}, ${comments}, ${tickets} RESTART IDENTITY CASCADE`);

  // Upsert teams (by name) and collect their ids.
  const teamIdByName = new Map<string, number>();
  for (const name of TEAM_NAMES) {
    const [row] = await db
      .insert(teams)
      .values({ name })
      .onConflictDoUpdate({ target: teams.name, set: { name } })
      .returning({ id: teams.id });
    teamIdByName.set(name, row.id);
  }

  // Ensure the singleton settings row exists (keep any admin-customized SLA on reseed).
  await db.insert(appSettings).values({ id: 1 }).onConflictDoNothing();

  // Upsert the cast and collect their ids by email. Email is the key: a row that already
  // exists (e.g. the Cognito-provisioned demo user in prod) keeps its real sub and just gets
  // its profile/role updated, so the live demo sign-in lands on the seeded admin. New rows
  // get the dev-token sub used by the local dev sign-in.
  const idByEmail = new Map<string, number>();
  for (const p of CAST) {
    const teamId = p.team ? teamIdByName.get(p.team) ?? null : null;
    const patch = { firstName: p.firstName, lastName: p.lastName, role: p.role, teamId };
    let [row] = await db.update(users).set(patch).where(eq(users.email, p.email)).returning({ id: users.id });
    if (!row) {
      [row] = await db
        .insert(users)
        .values({ cognitoSub: `dev-${p.email}`, email: p.email, ...patch })
        .returning({ id: users.id });
    }
    idByEmail.set(p.email, row.id);
  }

  const agentIds = CAST.filter((c) => c.role !== 'user').map((c) => idByEmail.get(c.email)!);
  const requesterIds = CAST.filter((c) => c.role === 'user').map((c) => idByEmail.get(c.email)!);
  const demoId = idByEmail.get('recruiter@demo.com')!;

  const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];

  let created = 0;
  // 36 tickets spread across the last 14 days (a few per day, dated dynamically).
  for (let i = 0; i < 36; i++) {
    const daysAgo = i % 14;
    const createdAt = new Date(now - daysAgo * DAY - (i % 6) * 3 * 3_600_000);
    const status = pick(STATUSES, i);
    const subject = pick(SUBJECTS, i);
    const requester = requesterIds[i % requesterIds.length];
    // Open/unassigned tickets stay unassigned; everything else gets an agent (demo gets a share).
    const assignedToId = status === 'Open' ? null : i % 3 === 0 ? demoId : pick(agentIds, i);

    const [ticket] = await db
      .insert(tickets)
      .values({
        title: subject.title,
        description: subject.description,
        product: subject.product,
        status,
        priority: pick(PRIORITIES, i),
        impact: pick(IMPACTS, i),
        category: pick(CATEGORIES, i),
        createdById: requester,
        assignedToId,
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: tickets.id });
    created++;

    // Changelog: always a creation marker; add assign/status events for worked tickets.
    const events: (typeof ticketEvents.$inferInsert)[] = [
      { ticketId: ticket.id, actorId: requester, field: 'created', toValue: 'Open', createdAt },
    ];
    if (assignedToId) {
      const t1 = new Date(createdAt.getTime() + 2 * 3_600_000);
      const assignee = CAST.find((c) => idByEmail.get(c.email) === assignedToId)!;
      events.push({
        ticketId: ticket.id,
        actorId: pick(agentIds, i),
        field: 'assignee',
        fromValue: 'Unassigned',
        toValue: `${assignee.firstName} ${assignee.lastName}`,
        createdAt: t1,
      });
      if (status !== 'Assigned') {
        events.push({
          ticketId: ticket.id,
          actorId: assignedToId,
          field: 'status',
          fromValue: 'Assigned',
          toValue: status,
          createdAt: new Date(createdAt.getTime() + 5 * 3_600_000),
        });
      }
    }
    await db.insert(ticketEvents).values(events);

    // A couple of tickets get a comment for a richer detail view.
    if (i % 5 === 0 && assignedToId) {
      await db.insert(comments).values({
        ticketId: ticket.id,
        authorId: assignedToId,
        body: 'Thanks for the report — taking a look now and will follow up shortly.',
        createdAt: new Date(createdAt.getTime() + 3 * 3_600_000),
      });
    }
  }

  await client.end();
  // eslint-disable-next-line no-console
  console.log(`Seeded ${CAST.length} users and ${created} tickets across 14 days.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
