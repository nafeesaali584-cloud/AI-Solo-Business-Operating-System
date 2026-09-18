// Quick connectivity verification script
const fs = require("fs");
const path = require("path");

// Native env loader
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const { PrismaClient } = require("@prisma/client");

async function checkConnection() {
  const prisma = new PrismaClient();
  try {
    console.log("Testing connection to PostgreSQL database...");
    await prisma.$connect();
    console.log("✅ SUCCESS: Successfully connected to PostgreSQL database!");
    const count = await prisma.lead.count();
    console.log(`Database tables ready! Total leads currently in database: ${count}`);
  } catch (err) {
    console.error("❌ CONNECTION FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
