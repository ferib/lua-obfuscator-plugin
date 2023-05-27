"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helper = void 0;
const webView_1 = require("../utils/webView");
const vscode = __importStar(require("vscode"));
const deobfuscateErrorReport_1 = require("../obfuscate/deobfuscateErrorReport");
function helper() {
    const column = {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
    };
    const options = {
        enableScripts: true,
    };
    const panel = vscode.window.createWebviewPanel("lua.test", "The doctor is in!", column, options);
    panel.webview.html = (0, webView_1.getWebviewContent)();
    panel.webview.onDidReceiveMessage((message) => {
        const regex = /\[string\s+"(.+)"\]:([\d]+):\s+(.+)/g;
        let results = [];
        let matches;
        let inspectOnly = false;
        switch (message.command) {
            case "inspect":
                inspectOnly = true;
            case "parse":
                while ((matches = regex.exec(message.crashlog))) {
                    const [, path, lineNum, message] = matches;
                    results.push({ path, line: parseInt(lineNum), message });
                }
                (0, deobfuscateErrorReport_1.deobfuscateErrorReport)(results, message.isMinified, inspectOnly);
                return;
        }
    }, undefined);
}
exports.helper = helper;
