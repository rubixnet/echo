import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const envFile = ".env.local";
let convex;
let app;
let stopping = false;
let localUrl;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  convex?.kill("SIGTERM");
  app?.kill("SIGTERM");
  setTimeout(() => process.exit(code), 1000).unref();
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

convex = spawn("npx", ["convex", "dev"], { stdio: "inherit" });
convex.on("error", (error) => {
  console.error("Could not start the local Convex backend:", error.message);
  stop(1);
});
convex.on("exit", (code) => {
  if (!stopping) {
    console.error(`Local Convex stopped${code === null ? "" : ` (${code})`}.`);
    stop(code || 1);
  }
});

// `convex dev` writes these values when it creates/selects a local deployment.
// Wait for the backend itself before Next.js reads its public Convex URL.
const deadline = Date.now() + 90_000;
while (Date.now() < deadline && !stopping) {
  if (existsSync(envFile)) {
    const contents = readFileSync(envFile, "utf8");
    localUrl = contents.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/m)?.[1]?.trim();
    if (localUrl) {
      try {
        const hostname = new URL(localUrl).hostname;
        if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
          console.error(".env.local still points to a hosted Convex deployment. Remove its CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_* lines, then run the first-time local setup command in README.md.");
          stop(1);
          break;
        }
        const response = await fetch(`${localUrl}/instance_name`);
        if (response.ok) break;
      } catch {
        // The local backend takes a few seconds to start on first run.
      }
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

if (stopping) process.exit(1);
if (!localUrl || Date.now() >= deadline) {
  console.error("Local Convex did not start within 90 seconds. Run the first-time setup command in README.md.");
  stop(1);
} else {
  app = spawn("npm", ["run", "dev"], { stdio: "inherit" });
  app.on("error", (error) => {
    console.error("Could not start Next.js:", error.message);
    stop(1);
  });
  app.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
