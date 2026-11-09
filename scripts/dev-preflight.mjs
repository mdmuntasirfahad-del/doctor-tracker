import fs from "node:fs";
import net from "node:net";

const clientEnvPath = new URL("../client/.env", import.meta.url);
const serverEnvPath = new URL("../server/.env", import.meta.url);

function fail(message) {
  console.error(`\n[predev] ${message}\n`);
  process.exit(1);
}

function readEnv(fileUrl, label) {
  if (!fs.existsSync(fileUrl)) {
    fail(`${label} is missing. Copy the matching .env.example file first.`);
  }

  const env = {};

  for (const line of fs.readFileSync(fileUrl, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    env[line.slice(0, index).trim()] = line.slice(index + 1);
  }

  return env;
}

const client = readEnv(clientEnvPath, "client/.env");
const server = readEnv(serverEnvPath, "server/.env");

const trimmed = (value) => (value ?? "").trim();

const clientSecret = trimmed(client.BETTER_AUTH_SECRET);
const serverSecret = trimmed(server.BETTER_AUTH_SECRET);

if (!clientSecret || !serverSecret) {
  fail("BETTER_AUTH_SECRET is missing from client/.env or server/.env.");
}

if (clientSecret.length < 32) {
  fail("BETTER_AUTH_SECRET must be at least 32 characters.");
}

if (clientSecret !== serverSecret) {
  fail("BETTER_AUTH_SECRET differs between client/.env and server/.env.");
}

if (client.BETTER_AUTH_SECRET !== server.BETTER_AUTH_SECRET) {
  console.warn(
    "[predev] Note: BETTER_AUTH_SECRET has surrounding whitespace. Runtime validation trims it, so the app will still work.",
  );
}

for (const key of ["MONGODB_URI", "MONGODB_DB", "BETTER_AUTH_URL"]) {
  if (!trimmed(client[key]) || !trimmed(server[key])) {
    fail(`${key} is missing from client/.env or server/.env.`);
  }

  if (trimmed(client[key]) !== trimmed(server[key])) {
    fail(`${key} differs between client/.env and server/.env.`);
  }
}

let apiUrl;

try {
  apiUrl = new URL(trimmed(client.API_URL));
} catch {
  fail("API_URL must be a valid absolute URL in client/.env.");
}

const apiPort = apiUrl.port || (apiUrl.protocol === "https:" ? "443" : "80");
const serverPort = trimmed(server.PORT) || "4000";

if (apiPort !== serverPort) {
  fail(`API_URL points to port ${apiPort}, but server PORT is ${serverPort}.`);
}

const publicUrl = trimmed(client.NEXT_PUBLIC_APP_URL).replace(/\/+$/, "");
const authUrl = trimmed(client.BETTER_AUTH_URL).replace(/\/+$/, "");

if (publicUrl && authUrl && publicUrl !== authUrl) {
  console.warn(
    "[predev] Note: NEXT_PUBLIC_APP_URL and BETTER_AUTH_URL differ. Auth uses the current browser origin.",
  );
}

// Check whether a port is actually occupied.
// TIME_WAIT connections are not treated as active listeners.
function canBind(port, host) {
  return new Promise((resolve, reject) => {
    const testServer = net.createServer();

    testServer.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(true);
      } else {
        reject(error);
      }
    });

    testServer.listen(
      {
        port,
        host,
        exclusive: true,
      },
      () => {
        testServer.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(false);
          }
        });
      },
    );
  });
}

async function portInUse(port) {
  try {
    const [ipv4, ipv6] = await Promise.all([canBind(port, "127.0.0.1"), canBind(port, "::1")]);

    return ipv4 || ipv6;
  } catch (error) {
    fail(`Unable to check port ${port}: ${error.message}`);
  }
}

// Check required development ports.
for (const [label, port] of [
  ["Next.js", 3000],
  ["Express API", 4000],
]) {
  if (await portInUse(port)) {
    fail(
      `Port ${port} (${label}) is already in use. Stop that process, then run npm run dev again. On Windows: netstat -ano | findstr :${port}`,
    );
  }
}

console.info("[predev] Environment is consistent and ports 3000/4000 are free.");
