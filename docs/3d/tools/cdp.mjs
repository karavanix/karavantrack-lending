// node cdp.mjs <port> <tabId> <file-with-async-fn-expression>
import { readFileSync } from "fs";
const [port, id, file] = process.argv.slice(2);
const ws = new WebSocket(`ws://localhost:${port}/devtools/page/${id}`);
await new Promise((r) => (ws.onopen = r));
let n = 0;
const call = (method, params) => new Promise((res) => {
  const mid = ++n;
  const on = (e) => { const m = JSON.parse(e.data); if (m.id === mid) { ws.removeEventListener("message", on); res(m); } };
  ws.addEventListener("message", on);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
const r = await call("Runtime.evaluate", { expression: `(${readFileSync(file, "utf8")})()`, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r, null, 1));
ws.close();
