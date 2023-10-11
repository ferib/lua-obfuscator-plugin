// webview for Wow Lua error parsing
import fs from "fs";
import path from "path";

export function getWebviewContent():string{
  try{
    return fs.readFileSync(path.join(__dirname + "..","webView.html"), "utf8");
    }catch(e){
    // On mac it might have be lower case (macOS filesystem is not case-sensitive)
    return fs.readFileSync(path.join(__dirname + "..","webview.html"), "utf8");
    }
}
