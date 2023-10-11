import * as vscode from "vscode";
import constants from "../utils/constants.json";
import { parseConfig } from "../utils/getConfigs";
import axios from "axios";
import { AxiosResponse } from "axios";

export type Callback = (code: string) => void;

export function obfuscateScript(script: string, callback: Callback) {
  vscode.window.showInformationMessage("Obfuscation starting...");
  callObfuscator(script, callback);
}

type Response = {code: string|null,message:string|null, sessionId: string|null}

export async function callObfuscator(
  script: string,
  callback: Callback
): Promise<void> {
  const config = parseConfig();
  console.log(constants.obfuscateUrl + "newscript")
  console.log(script)
  const newScript : AxiosResponse<Response> = await axios
    .post(constants.obfuscateUrl + "newscript", script, {
      headers: {
        "Content-Type": "text/plain",
        apikey: constants.apiKey,
      },
    })
    .catch((err) => {
      if (err.response.status === 502) {
        vscode.window.showErrorMessage("Something went wrong with uploading, try again later!");
        throw Error();
      }
      vscode.window.showErrorMessage(
        "Failed to upload script! (Error: " + err.response.status + ")"
      );
      console.log(err.message);
      throw Error();
    });
  if (newScript.status !== 200) {
    vscode.window.showErrorMessage(
      "Failed uploading script! (Error: " + newScript.status + ")"
    );
    throw Error();
  }
  if (!newScript.data.sessionId) {
    vscode.window.showErrorMessage("Failed to upload script!");
    throw Error();
  }
    
  const obfsucated : AxiosResponse<Response> = await axios
    .post(constants.obfuscateUrl + "Obfuscate", config, {
      headers: {
        "Content-Type": "text/plain",
        apikey: constants.apiKey,
        sessionId: newScript.data.sessionId,
      },
    })
    .catch((err) => {
      console.trace({
        err,
        config,
        
             headers: {
               apikey: constants.apiKey,
               sessionId: newScript.data.sessionId,
             }
        ,}
      )
        if (err.response.status === 502) {
          vscode.window.showErrorMessage("Something went wrong, try again later!");
          throw Error();
        }
      vscode.window.showErrorMessage(
        "Failed to obfuscate script! (Error: " + err.response.status + ")"
      );
      throw Error();
    });
  if (obfsucated.status === 404) {
    vscode.window.showErrorMessage("Lua script failed to upload!");
    throw Error();
  }
  if (!obfsucated.data || !obfsucated.data.code) {
    vscode.window.showErrorMessage("Obfuscation failed!");
    throw Error();
  }
  callback(obfsucated.data.code);
}
