import * as vscode from "vscode";
import axios, { AxiosResponse } from "axios";
import constants from "../utils/constants.json";
import { ERR_DEFAULT, failedToUpload } from "./utils";

export type Response = {
    code: string|null,
    message:string|null, 
    sessionId: string|null,
}

export type ObfuscateResponse = Response & {
    debug: boolean| null
    variables: Record<string,string>
}

const ENDPOINT = `${constants.obfuscateUrl}newscript`

export async function callNewScript(scriptStr : string): Promise<Response> {
  const resp : AxiosResponse<Response> = await axios
    .post(ENDPOINT, scriptStr, {
      headers: {
        "Content-Type": "text/plain",
        apikey: constants.apiKey,
      },
    })
    .catch((err) => { 
      if (err.response.status === 502) {
        vscode.window.showErrorMessage(ERR_DEFAULT);
        throw Error();
      }
      vscode.window.showErrorMessage(
        failedToUpload(err.response.status)
      );
      console.log(err.message);
      throw Error();
    });
  if (resp.status !== 200) {
    vscode.window.showErrorMessage(
        failedToUpload(resp.status)
    );
    throw Error();
  }
  if (!resp.data.sessionId) {
    vscode.window.showErrorMessage(ERR_DEFAULT);
    throw Error();
  }
  return resp.data
}
