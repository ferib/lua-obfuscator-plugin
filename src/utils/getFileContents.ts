import * as vscode from "vscode";

export function getFileContents(
  path: string,
  uris: vscode.Uri[]
): Promise<string> {
  return new Promise(async (resolve) => {
    let fileContent = null;
    let openDocument = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uris.toString()
    );
    if (openDocument) {
      resolve(openDocument.getText());
    } else {
      openDocument = await vscode.workspace.openTextDocument(uris[0]);
      if (!openDocument) {
        vscode.window.showErrorMessage("Failed opening file!");
        throw new Error("Failed opening file!");
      }
      await vscode.window.showTextDocument(openDocument); // open!
      fileContent = openDocument.getText();
    }
    if (!fileContent || fileContent == "") {
      vscode.window.showErrorMessage(`Failed reading '${path}'`);
      throw new Error(`Failed reading '${path}'`);
    }
    resolve(fileContent);
  });
}
