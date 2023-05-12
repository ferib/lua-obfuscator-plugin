// webview for Wow Lua error parsing
import fs from "fs";

export function getWebviewContent() {
  return fs.readFileSync(__dirname + "/webview.html", "utf8");
}
