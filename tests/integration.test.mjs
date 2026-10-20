import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";

test("local app: auth, selected files, read-only Claude invocation, source revocation and request protection", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "jarvis-integration-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const selected = path.join(dir, "school");
  await fs.mkdir(selected);
  await fs.writeFile(
    path.join(selected, "Wochenplan KW43.txt"),
    "Woche 19.10.2026 bis 25.10.2026: Mathematik Brüche.",
  );
  await fs.writeFile(path.join(dir, "outside.txt"), "OUTSIDE-SECRET");
  const fake = path.join(dir, "fake-claude");
  const logfile = path.join(dir, "request.json");
  await fs.writeFile(
    fake,
    `#!/usr/bin/env node\nconst fs=require('node:fs');const args=process.argv.slice(2);if(args[0]==='auth'){console.log(JSON.stringify({loggedIn:true,authMethod:'claude.ai'}));process.exit(0);}let input='';process.stdin.on('data',c=>input+=c);process.stdin.on('end',()=>{fs.writeFileSync(process.env.JARVIS_TEST_LOG,JSON.stringify({args,input,hasKey:!!process.env.ANTHROPIC_API_KEY}));console.log(JSON.stringify({result:'Mathematik: Brüche. [1]',is_error:false}));});\n`,
    { mode: 0o700 },
  );
  const port = 4329;
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      CODESPACES: "true",
      CODESPACE_NAME: "hugo-test",
      GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "app.github.dev",
      JARVIS_CLAUDE_BIN: fake,
      JARVIS_DATA_DIR: path.join(dir, "data"),
      JARVIS_TEST_LOG: logfile,
      ANTHROPIC_API_KEY: "fake-key-must-not-pass",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  let log = "";
  child.stdout.on("data", (chunk) => (log += chunk));
  child.stderr.on("data", (chunk) => (log += chunk));
  for (let n = 0; n < 80 && !log.includes("Hugo ist bereit"); n++) {
    if (child.exitCode !== null) throw new Error(log);
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.match(log, /Hugo ist bereit/);
  const sessionResponse = await fetch(`${base}/api/session`);
  const { token } = await sessionResponse.json();
  const cookie = sessionResponse.headers.get("set-cookie").split(";")[0];
  const request = (route, options = {}) =>
    fetch(base + route, {
      ...options,
      headers: {
        Cookie: cookie,
        "X-Hugo-Token": token,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  assert.equal((await fetch(`${base}/api/status`)).status, 403);
  assert.equal(
    (
      await fetch(`${base}/api/status`, {
        headers: { Cookie: cookie, "X-Jarvis-Token": token },
      })
    ).status,
    403,
  );
  for (const file of [
    "api.js",
    "state.js",
    "ui.js",
    "voice.js",
    "widgets.js",
    "widget-layout.js",
  ]) {
    const asset = await fetch(`${base}/${file}`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("content-type"), /javascript/);
  }
  const navigationStatus = (route) =>
    new Promise((resolve, reject) => {
      const req = http.get(
        base + route,
        {
          headers: {
            "Sec-Fetch-Site": "cross-site",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Dest": "document",
          },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        },
      );
      req.on("error", reject);
    });
  assert.equal(await navigationStatus("/"), 200);
  assert.equal(await navigationStatus("/api/session"), 403);
  const forwardedStatus = (host, origin) =>
    new Promise((resolve, reject) => {
      const req = http.get(
        base + "/api/session",
        { headers: { Host: host, Origin: origin } },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        },
      );
      req.on("error", reject);
    });
  assert.equal(
    await forwardedStatus(
      `hugo-test-${port}.app.github.dev`,
      `https://hugo-test-${port}.app.github.dev`,
    ),
    200,
  );
  assert.equal(
    await forwardedStatus(
      `other-${port}.app.github.dev`,
      `https://other-${port}.app.github.dev`,
    ),
    403,
  );
  assert.equal(
    await forwardedStatus(
      `hugo-test-${port}.app.github.dev`,
      "https://evil.example",
    ),
    403,
  );

  assert.equal(
    (
      await fetch(`${base}/api/speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hallo" }),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/speech", {
        method: "POST",
        body: JSON.stringify({ text: "x".repeat(5001), voice: "invalid" }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/status", {
        headers: { Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  const status = await request("/api/status").then((r) => r.json());
  assert.equal(status.auth.loggedIn, true);
  assert.equal(
    (
      await fetch(`${base}/bridge/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Hugo-Key": "wrong" },
        body: "{}",
      })
    ).status,
    403,
  );
  const key = await request("/api/integrations/browser-key").then((r) =>
    r.json(),
  );
  const source = {
    source: "klassenflow",
    weekStart: status.week.start,
    text: "Montag Mathematik: Wochenplanung Brüche.",
  };
  assert.equal(
    (
      await fetch(`${base}/bridge/sync`, {
        method: "POST",
        headers: {
          Origin: "https://evil.example",
          "Content-Type": "application/json",
          "X-Hugo-Key": key.key,
        },
        body: JSON.stringify(source),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(`${base}/bridge/sync`, {
        method: "POST",
        headers: {
          Origin: "chrome-extension://" + "a".repeat(32),
          "Content-Type": "application/json",
          "X-Hugo-Key": key.key,
        },
        body: JSON.stringify(source),
      })
    ).status,
    200,
  );
  const plan = await request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt: "Diese Woche", mode: "planning" }),
  }).then((r) => r.json());
  assert.equal(plan.mode, "planning");
  assert.equal(plan.coverage.read, 1);
  assert.equal(plan.sources[0].url, "https://app.klassenflow.com/");
  assert.ok(plan.sources[0].capturedAt);
  const planningInvocation = JSON.parse(await fs.readFile(logfile, "utf8"));
  assert.match(planningInvocation.input, /Wochenplanung Brüche/);
  assert.ok(!planningInvocation.input.includes("OUTSIDE-SECRET"));

  const add = await request("/api/folders", {
    method: "POST",
    body: JSON.stringify({ path: selected }),
  });
  assert.equal(add.status, 200);
  const { folders } = await add.json();
  assert.equal(folders.length, 1);
  const response = await request("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      prompt: "Fasse meine Planung zusammen",
      history: [],
      mode: "documents",
    }),
  });
  assert.equal(response.status, 200);
  const answer = await response.json();
  assert.match(answer.text, /Brüche/);
  assert.equal(answer.coverage.read, 1);
  assert.equal(answer.sources.length, 1);
  const invocation = JSON.parse(await fs.readFile(logfile, "utf8"));
  assert.equal(invocation.hasKey, false);
  assert.ok(invocation.args.includes("--safe-mode"));
  assert.ok(invocation.args.includes("--restricted"));
  assert.equal(invocation.args[invocation.args.indexOf("--tools") + 1], "");
  assert.ok(invocation.args.includes("--no-session-persistence"));
  assert.ok(!invocation.input.includes("OUTSIDE-SECRET"));
  const download = await fetch(`${base}/source/${answer.sources[0].id}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(download.status, 200);
  assert.match(await download.text(), /Brüche/);
  const anonymous = await fetch(`${base}/source/${answer.sources[0].id}`);
  assert.notEqual(anonymous.status, 200);
  await request(`/api/folders/${folders[0].id}`, { method: "DELETE" });
  assert.notEqual(
    (
      await fetch(`${base}/source/${answer.sources[0].id}`, {
        headers: { Cookie: cookie },
      })
    ).status,
    200,
  );
  const noFolder = await request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt: "Hallo, was kannst du?" }),
  });
  assert.equal(noFolder.status, 200);
  const chat = await noFolder.json();
  assert.equal(chat.mode, "chat");
  assert.equal(chat.sources.length, 0);
  assert.equal(chat.coverage.read, 0);
  const missingDocs = await request("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      prompt: "Fasse die Planung zusammen",
      mode: "documents",
    }),
  });
  assert.equal(missingDocs.status, 200);
  assert.match((await missingDocs.json()).warnings.join(" "), /kein Ordner/);
  await request("/api/folders", {
    method: "POST",
    body: JSON.stringify({ path: selected }),
  });
  const normalChat = await request("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      prompt: "Was kann ich mit dir alles anstellen?",
      mode: "chat",
    }),
  });
  assert.equal(normalChat.status, 200);
  assert.equal((await normalChat.json()).coverage.read, 0);
  const chatInvocation = JSON.parse(await fs.readFile(logfile, "utf8"));
  assert.ok(!chatInvocation.input.includes("Mathematik Brüche"));
  assert.match(chatInvocation.input, /Normaler Chat/);
  assert.equal(
    await fs.readFile(path.join(selected, "Wochenplan KW43.txt"), "utf8"),
    "Woche 19.10.2026 bis 25.10.2026: Mathematik Brüche.",
  );
});
