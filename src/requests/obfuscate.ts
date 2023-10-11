import * as vscode from "vscode";
import axios, { AxiosResponse } from "axios";
import constants from "../utils/constants.json";
import { parseConfig } from "src/utils/getConfigs";
import { ERR_DEFAULT, ERR_FAILED_OBFUSCATE, failedToObfuscate, failedToUpload } from "./utils";

export type Response = {
    code: string|null,
    message:string|null, 
    sessionId: string|null,
}

export type ObfuscateResponse = Response & {
    debug: boolean| null
}

const ENDPOINT = `${constants.obfuscateUrl}Obfuscate`

export async function callObfuscate(sessionId: string, debug?: boolean): Promise<ObfuscateResponse|null> {
  const config = parseConfig();
  if(!config){
    return null
  }

  const obfsucated: AxiosResponse<ObfuscateResponse>|void = await axios
    .post(ENDPOINT, {...config, debug }, {
      headers: {
        "Content-Type": "text/plain",
        apikey: constants.apiKey,
        sessionId: sessionId,
      },
    })
    .catch((err) => {
      console.trace({
        err,
        config, 
             headers: {
               apikey: constants.apiKey,
               sessionId: sessionId,
             }
        ,}
      )
        if (err.response.status === 502) {
          vscode.window.showErrorMessage(ERR_DEFAULT)
        }
      vscode.window.showErrorMessage(
        failedToObfuscate(err.response.status)
      )
    });

  if (!obfsucated || obfsucated.status === 404) {
    vscode.window.showErrorMessage(failedToUpload("Lua script failed to upload"))
    return null
  }
  if (!obfsucated.data || !obfsucated.data.code) {
    vscode.window.showErrorMessage(ERR_FAILED_OBFUSCATE).then(err=>{throw Error(err)})
        return null
  }
    return obfsucated.data
}

