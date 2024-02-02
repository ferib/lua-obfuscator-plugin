// webview for Wow Lua error parsing
import fs from "fs";

export function getWebviewContent() {
  return fs.readFileSync(__dirname + "/../webView.html", "utf8");
}
