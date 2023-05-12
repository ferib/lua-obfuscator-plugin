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
exports.deobfuscateErrorReport = void 0;
const vscode = __importStar(require("vscode"));
const getFileContents_1 = require("../utils/getFileContents");
const callObfuscator_1 = require("./callObfuscator");
async function deobfuscateErrorReport(stacktrace, isMinified, inspectOnly) {
    // Verify stacktrace
    if (stacktrace.length == 0) {
        // this is either bad or good
        vscode.window.showErrorMessage("Empty stacktrace!?");
        return;
    }
    // find file based on crashlog name?
    stacktrace.forEach(async function (x) {
        let path = x.path; //"test.lua";
        let fileContent = null;
        // TODO: sometimes the end of the path is replaced with `...`, replace with `**.lua` ?
        vscode.workspace.findFiles(`**/${path}`, "", 1).then(async (uris) => {
            if (uris.length === 0) {
                vscode.window.showWarningMessage(`Could not find '${path}'`);
                return;
            }
            fileContent = await (0, getFileContents_1.getFileContents)(path, uris);
            if (!fileContent) {
                vscode.window.showErrorMessage("Failed opening file!");
                throw new Error("Failed opening file!");
            }
            // only do if 'minified'
            if (isMinified) {
                // Obfuscate the script and locate the lines?
                (0, callObfuscator_1.callObfuscator)(fileContent, parseContent);
            }
            else {
                // pass as-is
                parseContent({ code: fileContent });
            }
            async function parseContent(body) {
                // inspect means we obfuscate the whole file and mark pos for
                // manual inspection
                if (inspectOnly) {
                    const openDocument = await vscode.workspace.openTextDocument(uris[0]);
                    // overwrite existing file
                    let existingEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === openDocument.uri.toString());
                    if (!existingEditor) {
                        await vscode.window.showTextDocument(openDocument); // open up?
                        existingEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === openDocument.uri.toString());
                        if (!existingEditor) {
                            vscode.window.showErrorMessage(`Failed opening ${path}`);
                            return;
                        }
                    }
                    existingEditor
                        .edit((editBuilder) => {
                        var editor_full_range = new vscode.Range(openDocument.positionAt(0), openDocument.positionAt(openDocument.getText().length));
                        editBuilder.replace(editor_full_range, body.code);
                    })
                        .then(() => {
                        // make sure its edited
                        vscode.window.showInformationMessage(`Obfuscated ${path}`);
                        // write content to file and mark line(s)
                        const decorationType = vscode.window.createTextEditorDecorationType({
                            backgroundColor: "#FF00007F",
                            gutterIconPath: "/img/profiler_button.png",
                            border: "1px solid white",
                            borderRadius: "3px",
                            overviewRulerColor: "red",
                            overviewRulerLane: vscode.OverviewRulerLane.Full,
                        });
                        // find line
                        const errLine = openDocument.lineAt(x.line - 1);
                        let lineRange = errLine.range;
                        // remove tabs?
                        function countLeadingTabs(str) {
                            const match = str.match(/^[\t\s]*/);
                            return match ? match[0].length : 0;
                        }
                        lineRange = new vscode.Range(new vscode.Position(lineRange.start.line, lineRange.start.character + countLeadingTabs(errLine.text)), lineRange.end);
                        // TODO: re-apply decorations when switching tabs!!
                        // find the editor that belongs to the document
                        const editor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === openDocument.uri.toString());
                        if (!editor) {
                            vscode.window.showErrorMessage(`Failed opening ${path}`);
                            return;
                        }
                        editor.setDecorations(decorationType, [lineRange]);
                    });
                    //});
                }
                else {
                    if (!fileContent) {
                        vscode.window.showErrorMessage("Failed opening file!");
                        return;
                    }
                    const lines = body.code.split("\n");
                    if (x.line < 1 || x.line > lines.length) {
                        return; // error?
                    }
                    let crashLine = lines[x.line - 1];
                    let debug = "";
                    for (let i = 0; i < 10; i++) {
                        if (i >= 5)
                            debug += lines[x.line + (i - 5)];
                        else
                            debug += lines[x.line - i];
                    }
                    //vscode.window.showInformationMessage(`${x.path}:${x.line}: '${crashLine}'\n\n${debug}`)
                    vscode.window.showInformationMessage(`${x.path}:${x.line}` +
                        "\n---------------------------------" +
                        `\n${crashLine}` +
                        "\n---------------------------------" +
                        `\n${debug}\n`);
                    // Next, figure out how we can identify this? if we had an AST we
                    // could parse it, find the line/token and use that to match against
                    // the original source. Alternative is to use some kind of mapping
                    // and find original source? or pray the source is not properly
                    // obfuscated and use lookup names?
                    // NOTE: this works for my usecase, but it can't be this ugly
                    let tokens = [];
                    if (crashLine.includes(".")) {
                        let dotIndex = crashLine.indexOf(".");
                        if (dotIndex !== -1) {
                            let substr = crashLine.substring(dotIndex, crashLine.length);
                            let len = substr.length;
                            // find end, may it be ' ', '(', '.' or whatever?
                            // TODO: use Regex?
                            let endIndex = substr.indexOf(" ");
                            if (endIndex === -1)
                                endIndex = substr.indexOf("(");
                            if (endIndex === -1)
                                endIndex = substr.indexOf(".");
                            if (endIndex !== -1)
                                len = endIndex + 1;
                            let possLookup = substr.substr(0, len);
                            tokens.push(possLookup);
                            // now find the token in original source and mark it?
                            let index = fileContent.indexOf(possLookup);
                            // find line by index
                            const cleanLines = fileContent.split("\n"); // source split
                            let indexCount = 0;
                            const openDocument = await vscode.workspace.openTextDocument(uris[0]);
                            let lineRange = openDocument.lineAt(0).range;
                            for (let i = 0; i < cleanLines.length; i++) {
                                const lineLen = cleanLines[i].length;
                                if (index >= indexCount && index < indexCount + lineLen) {
                                    // found line!
                                    const errLine = openDocument.lineAt(i);
                                    lineRange = errLine.range;
                                    lineRange = new vscode.Range(new vscode.Position(lineRange.start.line, lineRange.start.character +
                                        (errLine.text.match(/^[\t\s]*/)
                                            ? errLine.text.match(/^[\t\s]*/)[0]?.length ?? 0
                                            : 0)), lineRange.end);
                                    break;
                                }
                                indexCount += lineLen; // add line count
                            }
                            const decorationType = vscode.window.createTextEditorDecorationType({
                                backgroundColor: "#FF00007F",
                                gutterIconPath: "/img/profiler_button.png",
                                border: "1px solid white",
                                borderRadius: "3px",
                                overviewRulerColor: "red",
                                overviewRulerLane: vscode.OverviewRulerLane.Full,
                            });
                            // find the editor that belongs to the document
                            const editor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === openDocument.uri.toString());
                            if (!editor) {
                                vscode.window.showErrorMessage(`Failed opening ${path}`);
                                return;
                            }
                            editor.setDecorations(decorationType, [lineRange]);
                        }
                    }
                }
            }
        });
    });
}
exports.deobfuscateErrorReport = deobfuscateErrorReport;
