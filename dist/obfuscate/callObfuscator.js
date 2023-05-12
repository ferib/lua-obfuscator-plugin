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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callObfuscator = exports.obfuscateScript = void 0;
const vscode = __importStar(require("vscode"));
const constants_json_1 = __importDefault(require("../utils/constants.json"));
const getConfigs_1 = require("../utils/getConfigs");
const axios_1 = __importDefault(require("axios"));
function obfuscateScript(script, callback) {
    vscode.window.showInformationMessage("Obfuscation starting...");
    callObfuscator(script, callback);
}
exports.obfuscateScript = obfuscateScript;
async function callObfuscator(script, callback) {
    const config = (0, getConfigs_1.parseConfig)();
    console.log(constants_json_1.default.obfuscateUrl + "newscript");
    console.log(script);
    const newScript = await axios_1.default
        .post(constants_json_1.default.obfuscateUrl + "newscript", script, {
        headers: {
            "Content-Type": "text/plain",
            apikey: constants_json_1.default.apiKey,
        },
    })
        .catch((err) => {
        if (err.response.status === 502) {
            vscode.window.showErrorMessage("Something went wrong with uploading, try again later!");
            throw Error();
        }
        vscode.window.showErrorMessage("Failed to upload script! (Error: " + err.response.status + ")");
        console.log(err.message);
        throw Error();
    });
    if (newScript.status !== 200) {
        vscode.window.showErrorMessage("Failed uploading script! (Error: " + newScript.status + ")");
        throw Error();
    }
    if (!newScript.data.sessionId) {
        vscode.window.showErrorMessage("Failed to upload script!");
        throw Error();
    }
    const obfsucated = await axios_1.default
        .post(constants_json_1.default.obfuscateUrl + "Obfuscate", config, {
        headers: {
            "Content-Type": "text/plain",
            apikey: constants_json_1.default.apiKey,
            sessionId: newScript.data.sessionId,
        },
    })
        .catch((err) => {
        console.trace({
            err,
            config,
            headers: {
                apikey: constants_json_1.default.apiKey,
                sessionId: newScript.data.sessionId,
            },
        });
        if (err.response.status === 502) {
            vscode.window.showErrorMessage("Something went wrong, try again later!");
            throw Error();
        }
        vscode.window.showErrorMessage("Failed to obfuscate script! (Error: " + err.response.status + ")");
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
exports.callObfuscator = callObfuscator;
