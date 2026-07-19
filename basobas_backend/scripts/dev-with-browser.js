const { spawn, exec } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}`;

function waitForServer(url, cb) {
  const req = http.get(url, () => cb());
  req.on("error", () => setTimeout(() => waitForServer(url, cb), 500));
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd);
}

const child = spawn("nodemon", ["--exec", "ts-node", "src/index.ts"], {
  stdio: "inherit",
  shell: true,
});

waitForServer(URL, () => openBrowser(URL));

child.on("exit", (code) => process.exit(code));
