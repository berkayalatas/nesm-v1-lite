#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function paint(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function ok(text) {
  console.log(`${paint("green", "OK")} ${text}`);
}

function warn(text) {
  console.log(`${paint("yellow", "WARN")} ${text}`);
}

function fail(text) {
  console.log(`${paint("red", "ERROR")} ${text}`);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function getNodeMajorVersion() {
  const major = process.versions.node.split(".")[0];
  return Number.parseInt(major, 10);
}

async function checkDatabaseConnection(databaseUrl) {
  if (!databaseUrl) {
    fail("DATABASE_URL is missing. Cannot verify database connectivity.");
    return false;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    ok("Database connection is reachable (SELECT 1 succeeded).");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    fail(`Database connection failed: ${message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log(paint("cyan", "NESM Environment Check"));

  const cwd = process.cwd();
  const envPath = path.join(cwd, ".env");
  const envFileVars = parseEnvFile(envPath);

  const nodeMajor = getNodeMajorVersion();
  if (nodeMajor >= 20) {
    ok(`Node.js version is ${process.versions.node} (>= 20).`);
  } else {
    fail(`Node.js version is ${process.versions.node}. Please use Node.js 20 or newer.`);
  }

  if (fs.existsSync(envPath)) {
    ok(".env file found.");
  } else {
    fail(".env file is missing.");
  }

  const getVar = (key) => process.env[key] ?? envFileVars[key] ?? "";

  const authSecret = getVar("AUTH_SECRET");
  if (authSecret) {
    ok("AUTH_SECRET is present.");
  } else {
    warn("AUTH_SECRET is missing. Authentication sessions may fail.");
  }

  const blobToken = getVar("BLOB_READ_WRITE_TOKEN");
  if (blobToken) {
    ok("BLOB_READ_WRITE_TOKEN is present.");
  } else {
    warn("BLOB_READ_WRITE_TOKEN is missing (optional for local dev unless avatar upload is enabled).");
  }

  const dbOk = await checkDatabaseConnection(getVar("DATABASE_URL"));

  if (nodeMajor < 20 || !fs.existsSync(envPath) || !dbOk) {
    console.log(paint("red", "NESM check completed with errors."));
    process.exitCode = 1;
    return;
  }

  console.log(paint("green", "NESM check completed successfully."));
}

void main();
