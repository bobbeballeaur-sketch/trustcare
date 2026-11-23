// Runs during every deploy: fills the database with demo data only if it's empty
// (so the first deploy has data, and later deploys never wipe anything).
import { PrismaClient } from "@prisma/client";
import { resetDemoData } from "../src/lib/demo-data";

const db = new PrismaClient();
(async () => {
  const users = await db.user.count();
  if (users === 0) console.log("Empty database — adding demo data:", await resetDemoData(db));
  else console.log(`Database already has ${users} users — leaving it as it is.`);
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
