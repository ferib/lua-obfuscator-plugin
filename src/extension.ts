// Forked from clvbrew
import * as vscode from "vscode";
import { obfuscateScript } from "./obfuscate/callObfuscator";
import { hightlight } from "./cmd/hightlight";
import { helper } from "./cmd/helper";
import { obfuscateBody } from "./cmd/obfuscate";

let obfuscate = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left
);
obfuscate.command = "lua.obfuscate";
obfuscate.tooltip = "Obfuscate current script";
obfuscate.text = "$(pencil) obfuscate";

export function activate(context: vscode.ExtensionContext) {
  obfuscate.show();
  vscode.commands.registerCommand("lua.obfuscate", function () {
    if (!vscode.window.activeTextEditor) {
      vscode.window.showErrorMessage("Please open a file before obfuscating!");
      throw new Error("Please open a file before obfuscating!");
    }
    obfuscateScript(
      vscode.window.activeTextEditor.document.getText(),
      obfuscateBody
    );
  });
  vscode.commands.registerCommand("lua.obfuscatehighlighted", hightlight);
  context.subscriptions.push(
    vscode.commands.registerCommand("lua.helper", helper)
  );
}

export function deactivate() {
  obfuscate.dispose();
}
