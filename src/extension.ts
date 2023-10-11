// Forked from clvbrew
import * as vscode from "vscode";
import { obfuscateScript } from "./obfuscate/callObfuscator";
import { hightlight } from "./cmd/hightlight";
import { helper } from "./cmd/helper";
import { obfuscateBody } from "./cmd/obfuscate";
import { ERR_NO_FILE_TO_OBFUSCATE } from "./cmd/utils";

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
      vscode.window.showErrorMessage(ERR_NO_FILE_TO_OBFUSCATE);
        return
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
