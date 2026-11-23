// Run with: npm run seed — fills the database with the demo data.
import { PrismaClient } from "@prisma/client";
import { resetDemoData } from "../src/lib/demo-data";

const db = new PrismaClient();
resetDemoData(db)
  .then((r) => console.log("Demo data ready:", r))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
