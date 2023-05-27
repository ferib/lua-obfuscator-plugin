import { getOutputType } from "../utils/getConfigs";
import * as vscode from "vscode";

export function obfuscateBody(code: string) {
  const outputType = getOutputType();
  if (outputType == "create new file") {
    vscode.workspace.openTextDocument({ content: `${code}`, language: "lua" });
    vscode.window.showInformationMessage("obfuscated, opening new tab");
  } else if (outputType == "replace current file") {
    const text_editor = vscode.window.activeTextEditor;
    if (!text_editor) {
      vscode.window.showErrorMessage("Please open a file before obfuscating!");
      return;
    }
    // get range object for current editor
    var editor_full_range = new vscode.Range(
      text_editor.document.positionAt(0),
      text_editor.document.positionAt(text_editor.document.getText().length)
    );

    // replace current editor text with new text, requires range object
    text_editor.edit((editBuilder) => {
      editBuilder.replace(editor_full_range, code);
    });
    vscode.window.showInformationMessage(
      "obfuscated, and replaced current file"
    );
  } else if (outputType == "copy to clipboard") {
    vscode.env.clipboard.writeText(code);
    vscode.window.showInformationMessage("obfuscated, copied to clipboard");
  }
}
