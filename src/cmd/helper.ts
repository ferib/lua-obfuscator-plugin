import { getWebviewContent } from "../utils/webView";
import * as vscode from "vscode";
import { deobfuscateErrorReport } from "../obfuscate/deobfuscateErrorReport";

export function helper() {
  const column = {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: true,
  };

  const options = {
    enableScripts: true,
  };

  const panel = vscode.window.createWebviewPanel(
    "lua.test",
    "The doctor is in!",
    column,
    options
  );

  panel.webview.html = getWebviewContent();

  panel.webview.onDidReceiveMessage((message) => {
    const regex = /\[string\s+"(.+)"\]:([\d]+):\s+(.+)/g;
    let results = [];
    let matches;
    let inspectOnly = false;

    switch (message.command) {
      case "inspect":
        inspectOnly = true;
      case "parse":
        while ((matches = regex.exec(message.crashlog))) {
          const [, path, lineNum, message] = matches;
          results.push({ path, line: parseInt(lineNum), message });
        }

        deobfuscateErrorReport(results, message.isMinified, inspectOnly);
        return;
    }
  }, undefined);
}
