import * as vscode from "vscode";

export function getFileContents(
  path: string,
  uris: vscode.Uri[]
): Promise<string> {
  return new Promise(async (resolve,reject) => {
    let fileContent = null;
    let openDocument = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uris.toString()
    );
    if (openDocument) {
      return resolve(openDocument.getText());
    } else {
      openDocument = await vscode.workspace.openTextDocument(uris[0]);
      if (!openDocument) {
        vscode.window.showErrorMessage("Failed opening file!");
       return reject()
      }
      await vscode.window.showTextDocument(openDocument); // open!
      fileContent = openDocument.getText();
    }
    if (!fileContent || fileContent == "") {
      vscode.window.showErrorMessage(`Failed reading '${path}'`);
       return reject()
    }
    return resolve(fileContent);
  });
}
