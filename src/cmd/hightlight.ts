import * as vscode from "vscode";
import { obfuscateScript } from "../obfuscate/callObfuscator";
import { getOutputType } from "../utils/getConfigs";

export function hightlight(): any {
  const text_editor = vscode.window.activeTextEditor;
  if (!text_editor) {
    vscode.window.showErrorMessage("Please open a file before obfuscating!");
    throw Error();
  }
  const selection = text_editor.selection;

  if (!selection) {
    vscode.window.showErrorMessage(
      "Please, highlight a text before obfuscating!"
    );
    throw Error();
  }

  const selectedText = text_editor.document.getText(selection);
  if (!selectedText) {
    vscode.window.showErrorMessage(
      "Please, highlight a text before obfuscating!"
    );
    throw Error();
  }

  obfuscateScript(selectedText, function (code) {
    const outputType = getOutputType();
    switch (outputType) {
      case "create new file":
        vscode.workspace.openTextDocument({
          content: `${JSON.stringify(code)}`,
          language: "lua",
        });
        vscode.window.showInformationMessage("obfuscated, opening new tab");
        break;
      case "replace current file":
        const editor_range = new vscode.Range(
            selection.start,
            selection.end
        );
        text_editor.edit((editBuilder) => {
            editBuilder.replace(editor_range, code);
        });

        vscode.window.showInformationMessage(
          "obfuscated, and replaced current file"
        );
        break;
      case "copy to clipboard":
      default:
        vscode.env.clipboard.writeText(code);
        vscode.window.showInformationMessage("obfuscated, copied to clipboard");
    }
  });
}
