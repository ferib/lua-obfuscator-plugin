// Forked from clvbrew
//
// dependencies
const vscode = require('vscode');
const fetch = require('node-fetch');
//const { callbackify } = require('util');

// constants
const constants = {
	"obfuscate-url": 'https://luaobfuscator.com/api/obfuscator/',
};

var previousScripts = { }

// obfuscate button element
let obfuscate = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
obfuscate.command = "lua.obfuscate";
obfuscate.tooltip = "Obfuscate current script";
obfuscate.text = "$(pencil) obfuscate";

let profiler = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
profiler.command = "lua.injectProfiler";
profiler.tooltip = "Inject profiler sesnors";
profiler.text = "$(eye) Profiler";

// Helpers
function getAPIKey()
{
	const settings = vscode.workspace.getConfiguration('lua-obfuscator')
	if (!settings || settings['apikey'] == "") {
		vscode.window.showErrorMessage("API Key is necessary for usage of extension!")
		return
	}
	return settings['apikey'];
}
function getOutputType()
{
	const settings = vscode.workspace.getConfiguration('lua-obfuscator')
	if (!settings) {
		vscode.window.showErrorMessage("Failed opening settings!")
		return
	}

	return settings['outputType'];
}
function parseConfig()
{
	const settings = vscode.workspace.getConfiguration('lua-obfuscator')
	if (!settings) {
		vscode.window.showErrorMessage("Failed opening settings!")
		return
	}
	
	// build a config based on the VSCode settings
	const serializedJsonConfig = settings['RawConfig'];
	if (serializedJsonConfig != null && serializedJsonConfig != "")
	{
		try
		{
			var rawConfig = JSON.parse(serializedJsonConfig)
			return rawConfig
		}
		catch (err)
		{
			// Block so user knows?
			//vscode.window.showWarningMessage("Failed parsing RawConfig, proceeding with vscode config!")
			vscode.window.showErrorMessage("Failed parsing RawConfig!")
			return null;
		}
	}

	var config = {
		CustomPlugins: {
			ControlFlowFlattenV1AllBlocks: [ (settings['ControlFlowFlattenV1AllBlocks'] ? 100 : 0) ],
			EncryptStrings: [ (settings['EncryptStrings'] ? 100 : 0) ],
			SwizzleLookups: [ (settings['SwizzleLookups'] ? 100 : 0) ],
			MutateAllLiterals: [ (settings['MutateAllLiterals'] ? 100 : 0) ],
			EncryptFuncDeclaration: [ (settings['EncryptFuncDeclaration'] ? 100 : 0) ],
		},
		Virtualize: settings['Virtualize']
	}

	if (settings['MinifyAll'] == "None")
	{
		config.MinifiyAll = false; // default false, but lets be sure
	}
	else if (settings['MinifyAll'] == "Minify")
	{
		config.MinifiyAll = true; // write small-ish
		config.CustomPlugins.Minifier = true; // variable renaming
	}
	else
	{
		config.MinifiyAll = false; // beautified instead of single line
		// NOTE: line numbers are NOT exactly kept!
		config.CustomPlugins.Minifier = true; // variable renaming
	}
	return config;
}
function callObfuscator(script, config, apikey, callback)
{
	fetch(constants["obfuscate-url"] + "newscript", {
		method: "POST",
		headers: { 
			"Content-Type": "application/json",
			"apikey": apikey
		},
		body: script
	})
	.then((res) => {
		if (res.status != 200)
		{
			vscode.window.showErrorMessage("Failed uploading script! (Error: " + res.status + ")");
			throw Error();
		}			
		return res.json()
	})
	.then(body => {
		// Send one obfuscation request
		fetch(constants["obfuscate-url"] + "Obfuscate", {
			method: "POST",
			headers: { 
				"Content-Type": "application/json",
				"apikey": apikey,
				"sessionId": body.sessionId
			},
			
			// TODO: add free obf settings in here?
			body: JSON.stringify(config)
		})
		.then(res => {
			if (res.status == 404)
			{
				// session was not found/created?
				vscode.window.showErrorMessage("Lua script failed to upload!");
				throw Error();
			}

			return res.json()
		})
		.then(body => {callback(body)})
		.catch(function(reason) {
			vscode.window.showErrorMessage("Fatal obfuscation error!")
		})
	})
	.catch(function(reason) {
		vscode.window.showErrorMessage("Failed to upload script!")
		return
	})
}
function obfuscateScript(script, callback)
{
	const key = getAPIKey();
	if (key == null)
		return;

	const config = parseConfig();
	if (config == null)
		return;

	// Upload Lua script
	vscode.window.showInformationMessage("Obfuscation starting...")
	callObfuscator(script, config, key, callback)
}
function activate(context) {
	obfuscate.show()
	profiler.show()
	
	vscode.commands.registerCommand('lua.obfuscate', function () {
		// check if current file is being eddited open
		if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage("Please open a file before obfuscating!")
			return
		}
		var text_editor = vscode.window.activeTextEditor


		obfuscateScript(text_editor.document.getText(), function(body)
		{
			// display error msg?
			if (body.message != null)
			{
				vscode.window.showErrorMessage("Obfuscationed failed!\n--------------\n" + body.message);
				throw Error();
			}
	
			// determine output type & act on it
			const outputType = getOutputType();
			if (outputType == 'create new file') {
				vscode.workspace.openTextDocument({"content": `${body.code}`, "language": "lua"})
				vscode.window.showInformationMessage("obfuscated, opening new tab")
			} else if (outputType == 'replace current file') {
				// get range object for current editor
				var editor_full_range = new vscode.Range(
					text_editor.document.positionAt(0),
					text_editor.document.positionAt(text_editor.document.getText().length)
				)
				
				// replace current editor text with new text, requires range object
				text_editor.edit(editBuilder => {editBuilder.replace(editor_full_range, body.code)})
				vscode.window.showInformationMessage("obfuscated, and replaced current file")
			} else if (outputType == 'copy to clipboard') {
				vscode.env.clipboard.writeText(body.code);
				vscode.window.showInformationMessage("obfuscated, copied to clipboard")
			}
		});
	});

	// NOTE: This is old garbage, I bet no one even used this. Deprecated?
	vscode.commands.registerCommand('lua.injectProfiler', function () {
		const settings = vscode.workspace.getConfiguration('lua-obfuscator')
		
		if (!settings || settings['apikey'] == "") {
			vscode.window.showErrorMessage("API Key is necessary for usage of extension!")
			return
		} else if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage("Please open a text file before obfuscating!")
			return
		}

		var text_editor = vscode.window.activeTextEditor

		// check to undo or not
		if (previousScripts[text_editor.document.fileName] == null) {
			// notification
			vscode.window.showInformationMessage("Profiler starting...")

			// Upload Lua script
			let key =  settings['apikey']
			var config = {
				CustomPlugins: {
					WowProfiler: "Tinkr", //settings['WowProfiler'],
				},
			}

			var script = text_editor.document.getText();
			previousScripts[text_editor.document.fileName] = script; // save for later
			callObfuscator(script, config, key, function(body)
			{
				// display error msg?
				if (body.message != null)
				{
					vscode.window.showErrorMessage("Profiler injection failed!\n--------------\n" + body.message);
					throw Error();
				}

				// get range object for current editor
				var editor_full_range = new vscode.Range(
					text_editor.document.positionAt(0),
					text_editor.document.positionAt(text_editor.document.getText().length)
				)
				
				// replace current editor text with new text, keep track of previous text on next profile to undo
				text_editor.edit(editBuilder => {editBuilder.replace(editor_full_range, body.code)})
				vscode.window.showInformationMessage("Profiler injected! (Inject again to undo profiler)")
			})
		} else {
			// get range object for current editor
			var editor_full_range = new vscode.Range(
				text_editor.document.positionAt(0),
				text_editor.document.positionAt(text_editor.document.getText().length)
			)

			// change script back to original version
			text_editor.edit(editBuilder => {editBuilder.replace(editor_full_range, previousScripts[text_editor.document.fileName])})
			vscode.window.showInformationMessage("Profiler removed!")
			previousScripts[text_editor.document.fileName] = null;
		}
	});

	// TODO: Fix the highlighed obfuscator so it will be overwritten and not appended?
	context.subscriptions.push(vscode.commands.registerCommand('lua.obfuscatehighlighted', function () {
		var text_editor = vscode.window.activeTextEditor
		
		const selection = text_editor.selection;
		if (!selection) {
			vscode.window.showErrorMessage("Please, highlight a text before obfuscating!")
			return
		}
		const selectedText = text_editor.document.getText(selection);
		if(!selectedText){
			vscode.window.showErrorMessage("Please, highlight a text before obfuscating!")
			return
		}
		
		// call selectedText
		obfuscateScript(selectedText, function(body)
		{
			// display error msg?
			if (body.message != null)
			{
				vscode.window.showErrorMessage("Obfuscationed failed!\n--------------\n" + body.message);
				throw Error();
			}

			// determine output type & act on it
			const outputType = getOutputType()
			if (outputType == 'create new file') {
				vscode.workspace.openTextDocument({"content": `${body.code}`, "language": "lua"})
				vscode.window.showInformationMessage("obfuscated, opening new tab")
			} else if (outputType == 'replace current file') {
				// get range object for current editor
				var editor_full_range = new vscode.Range(
					text_editor.document.positionAt(0),
					text_editor.document.positionAt(selectedText.length)
				)
				
				// replace current editor text with new text, requires range object
				text_editor.edit(editBuilder => {editBuilder.replace(editor_full_range, body.code)})
				vscode.window.showInformationMessage("obfuscated, and replaced current file")
			} else if (outputType == 'copy to clipboard') {
				vscode.env.clipboard.writeText(body.code);
				vscode.window.showInformationMessage("obfuscated, copied to clipboard")
			}
		});
	}));
}
//exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	obfuscate.dispose()
	profiler.dispose()
	//changelog_.dispose()
}

module.exports = {
	activate,
	deactivate
}