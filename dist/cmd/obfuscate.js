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
exports.obfuscateBody = void 0;
const getConfigs_1 = require("../utils/getConfigs");
const vscode = __importStar(require("vscode"));
function obfuscateBody(code) {
    const outputType = (0, getConfigs_1.getOutputType)();
    if (outputType == "create new file") {
        vscode.workspace.openTextDocument({ content: `${code}`, language: "lua" });
        vscode.window.showInformationMessage("obfuscated, opening new tab");
    }
    else if (outputType == "replace current file") {
        const text_editor = vscode.window.activeTextEditor;
        if (!text_editor) {
            vscode.window.showErrorMessage("Please open a file before obfuscating!");
            return;
        }
        // get range object for current editor
        var editor_full_range = new vscode.Range(text_editor.document.positionAt(0), text_editor.document.positionAt(text_editor.document.getText().length));
        // replace current editor text with new text, requires range object
        text_editor.edit((editBuilder) => {
            editBuilder.replace(editor_full_range, code);
        });
        vscode.window.showInformationMessage("obfuscated, and replaced current file");
    }
    else if (outputType == "copy to clipboard") {
        vscode.env.clipboard.writeText(code);
        vscode.window.showInformationMessage("obfuscated, copied to clipboard");
    }
}
exports.obfuscateBody = obfuscateBody;
