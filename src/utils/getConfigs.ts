import * as vscode from "vscode";

type MinifiyAll = "None" | "Minify" | "Minify (but keep lines)";

export type Settings = {
  outputType: "create new file" | "replace current file" | "copy to clipboard";
  apikey: string;
  MinifyAll: MinifiyAll;
  ControlFlowFlattenV1AllBlocks: boolean;
  EncryptStrings: boolean;
  SwizzelLookups: boolean;
  MutateAllLiterals: boolean;
  EncryptFuncDellaration: boolean;
  Virualize: boolean;
  RawConfig: string;
};

export type Config = {
  CustomPlugins: {
    ControlFlowFlattenV1AllBlocks: number[];
    EncryptStrings: number[];
    SwizzleLookups: number[];
    MutateAllLiterals: number[];
    EncryptFuncDeclaration: number[];
    Minifier: boolean;
  };
  Virtualize: boolean;
  MinifyAll: boolean;
  Debug: boolean;
};

export function getOutputType() {
  const settings = vscode.workspace.getConfiguration("lua-obfuscator");
  if (!settings) {
    vscode.window.showErrorMessage("Failed opening settings!");
    return null;
  }

  return settings["outputType"] as
    | "create new file"
    | "replace current file"
    | "copy to clipboard";
}

export function parseConfig(): Config {
  const settings = vscode.workspace.getConfiguration("lua-obfuscator");
  if (!settings) {
    vscode.window.showErrorMessage("Failed opening settings!");
    throw new Error();
  }

  const config: Config = {
    CustomPlugins: {
      ControlFlowFlattenV1AllBlocks: [
        settings.get("ControlFlowFlattenV1AllBlocks") ? 100 : 0,
      ],
      EncryptStrings: [settings.get("EncryptStrings") ? 100 : 0],
      SwizzleLookups: [settings.get("SwizzleLookups") ? 100 : 0],
      MutateAllLiterals: [settings.get("MutateAllLiterals") ? 100 : 0],
      EncryptFuncDeclaration: [
        settings.get("EncryptFuncDeclaration") ? 100 : 0,
      ],
      Minifier: false,
    },
    Virtualize: !!settings.get("Virtualize"),
    MinifyAll: false,
    Debug: false,
  };

  switch (settings.MinifyAll) {
    case "Minify":
      config.MinifyAll = true; // write small-ish
      config.CustomPlugins.Minifier = true; // variable renaming
      break;
    case "Minify (but keep lines)":
      config.MinifyAll = false; // beautified instead of single line
      // NOTE: line numbers are NOT exactly kept!
      config.CustomPlugins.Minifier = true; // variable renaming
      break;
    case "None":
    default:
      config.MinifyAll = false;
      break;
  }
  return config;
}
