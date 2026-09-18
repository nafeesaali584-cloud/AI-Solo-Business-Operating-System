// Quick connectivity verification script
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");

async function checkConnection() {
  const prisma = new PrismaClient();
  try {
    console.log("Testing connection to PostgreSQL database...");
    await prisma.$connect();
    console.log("✅ SUCCESS: Successfully connected to PostgreSQL database!");
    const count = await prisma.lead.count().catch(() => null);
    if (count !== null) {
      console.log(`Database tables ready. Total leads in database: ${count}`);
    } else {
      console.log("Database connected, run 'npx prisma db push' to create tables.");
    }
  } catch (err) {
    console.error("❌ CONNECTION FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
