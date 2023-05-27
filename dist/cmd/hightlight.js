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
exports.hightlight = void 0;
const vscode = __importStar(require("vscode"));
const callObfuscator_1 = require("../obfuscate/callObfuscator");
const getConfigs_1 = require("../utils/getConfigs");
function hightlight() {
    const text_editor = vscode.window.activeTextEditor;
    if (!text_editor) {
        vscode.window.showErrorMessage("Please open a file before obfuscating!");
        throw Error();
    }
    const selection = text_editor.selection;
    if (!selection) {
        vscode.window.showErrorMessage("Please, highlight a text before obfuscating!");
        throw Error();
    }
    const selectedText = text_editor.document.getText(selection);
    if (!selectedText) {
        vscode.window.showErrorMessage("Please, highlight a text before obfuscating!");
        throw Error();
    }
    (0, callObfuscator_1.obfuscateScript)(selectedText, function (code) {
        const outputType = (0, getConfigs_1.getOutputType)();
        switch (outputType) {
            case "create new file":
                vscode.workspace.openTextDocument({
                    content: `${JSON.stringify(code)}`,
                    language: "lua",
                });
                vscode.window.showInformationMessage("obfuscated, opening new tab");
                break;
            case "replace current file":
                const editor_range = new vscode.Range(selection.start, selection.end);
                text_editor.edit((editBuilder) => {
                    editBuilder.replace(editor_range, code);
                });
                vscode.window.showInformationMessage("obfuscated, and replaced current file");
                break;
            case "copy to clipboard":
            default:
                vscode.env.clipboard.writeText(code);
                vscode.window.showInformationMessage("obfuscated, copied to clipboard");
        }
    });
}
exports.hightlight = hightlight;
