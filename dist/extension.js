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
exports.deactivate = exports.activate = void 0;
// Forked from clvbrew
const vscode = __importStar(require("vscode"));
const callObfuscator_1 = require("./obfuscate/callObfuscator");
const hightlight_1 = require("./cmd/hightlight");
const helper_1 = require("./cmd/helper");
const obfuscate_1 = require("./cmd/obfuscate");
let obfuscate = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
obfuscate.command = "lua.obfuscate";
obfuscate.tooltip = "Obfuscate current script";
obfuscate.text = "$(pencil) obfuscate";
function activate(context) {
    obfuscate.show();
    vscode.commands.registerCommand("lua.obfuscate", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage("Please open a file before obfuscating!");
            throw new Error("Please open a file before obfuscating!");
        }
        (0, callObfuscator_1.obfuscateScript)(vscode.window.activeTextEditor.document.getText(), obfuscate_1.obfuscateBody);
    });
    vscode.commands.registerCommand("lua.obfuscatehighlighted", hightlight_1.hightlight);
    context.subscriptions.push(vscode.commands.registerCommand("lua.helper", helper_1.helper));
}
exports.activate = activate;
function deactivate() {
    obfuscate.dispose();
}
exports.deactivate = deactivate;
