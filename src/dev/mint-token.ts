import 'dotenv/config';
import * as jwt from 'jsonwebtoken';

/**
 * Mints a locally-signed HS256 token for AUTH_MODE=dev so you can call the API
 * without AWS Cognito. NOT for production.
 *
 * Usage:
 *   npx tsx src/dev/mint-token.ts <email> [fullName] [group...]
 * Example (an admin):
 *   npx tsx src/dev/mint-token.ts alice@example.com "Alice Admin" admin
 */
const [, , email = 'dev@example.com', name = 'Dev User', ...groups] = process.argv;

const secret = process.env.DEV_AUTH_SECRET;
if (!secret) {
  // eslint-disable-next-line no-console
  console.error('DEV_AUTH_SECRET is not set (check your .env).');
  process.exit(1);
}

const token = jwt.sign(
  { sub: `dev-${email}`, email, name, 'cognito:groups': groups },
  secret,
  { expiresIn: '12h' },
);

// eslint-disable-next-line no-console
console.log(token);
