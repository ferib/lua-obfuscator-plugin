import * as vscode from "vscode";
import { callNewScript } from "src/requests/newScript";
import { callObfuscate } from "src/requests/obfuscate";

export type Callback = (code: string) => void;

export function obfuscateScript(script: string, callback: Callback) {
  vscode.window.showInformationMessage("Obfuscation starting...");
  callObfuscator(script, callback);
}


export async function callObfuscator(
  script: string,
  callback: Callback,
  debug?: boolean
): Promise<void> {
  const newScript = await callNewScript(script)
  if(!newScript.sessionId){ 
    return
  } 
  const obfsucated = await callObfuscate(newScript.sessionId, true)
  if(!obfsucated || !obfsucated.code || !obfsucated.sessionId){ 
    return
  } 
  callback(obfsucated.code);
}
