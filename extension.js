// Forked from clvbrew
//
// dependencies
const vscode = require('vscode');
const fetch = require('node-fetch');
const { inspect } = require('util');
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
async function deobfuscateErrorReport(stacktrace, rawConfig, isMinified, inspectOnly)
{
	// Verify stacktrace
	if (stacktrace.length == 0)
	{
		// this is either bad or good
		vscode.window.showErrorMessage("Empty stacktrace!?")
		return;
	}

	// Check config?
	/*
	let config;
	try
	{
		config = JSON.parse(rawConfig)
	}
	catch (err)
	{
		vscode.window.showErrorMessage("Failed parsing the given config!")
		return null;
	}
	*/

	// TODO: figure out how to JSON.parse correctly lol!
	let config = parseConfig();
	if (config == null)
		return;

	// get apikey
	const key = getAPIKey();
	if (key == null)
		return;

	// find file based on crashlog name?
	stacktrace.forEach(async function(x) {
		let path = x.path //"test.lua";
		let fileContent = "";
		// TODO: sometimes the end of the path is replaced with `...`, replace with `**.lua` ?
		vscode.workspace.findFiles(`**/${path}`, '', 1).then(async (uris) => {
			if (uris.length === 0)
			{
				vscode.window.showWarningMessage(`Could not find '${path}'`);
				return;
			}
				
		
			// Check if the file is already open in VSCode
			let openDocument = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uris.toString());
			if (openDocument) {
				// File is open, use its content
				fileContent = openDocument.getText();
			} else {
				// File is not open, read from disk?
				/*
				vscode.workspace.fs.readFile(uris[0]).then(content => {
					fileContent = content.toString();
				}, error => {
					//Error(error);
					vscode.window.showErrorMessage(error);
				});
				*/
				// just open it
				openDocument = await vscode.workspace.openTextDocument(uris[0])
				await vscode.window.showTextDocument(openDocument); // open!
				fileContent = openDocument.getText()
			}
			
			//
			if (fileContent == "")
			{
				vscode.window.showErrorMessage(`Failed reading '${path}'`);
				return;
			}
			
			
			// only do if 'minified'
			if (isMinified)
			{
				// Obfuscate the script and locate the lines?
				callObfuscator(fileContent, config, key, parseContent);
			} else {
				// pass as-is
				parseContent({code: fileContent})
			}

			async function parseContent(body) 
			{
				// display error msg?
				if (body.message != null)
				{
					vscode.window.showErrorMessage("Obfuscationed failed!\n--------------\n" + body.message);
					throw Error();
				}
				// inspect means we obfuscate the whole file and mark pos for
				// manual inspection	
				if (inspectOnly)
				{
					// overwrite existing file
					let existingEditor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === openDocument.uri.toString());
					if (!existingEditor)
					{
						openDocument = await vscode.workspace.openTextDocument(uris[0])
						await vscode.window.showTextDocument(openDocument); // open up?
						existingEditor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === openDocument.uri.toString());
						if (!existingEditor)
						{
							vscode.window.showErrorMessage(`Failed opening ${path}`);
							return
						}
					}
					existingEditor.edit(editBuilder => {
						var editor_full_range = new vscode.Range(
							openDocument.positionAt(0),
							openDocument.positionAt(openDocument.getText().length)
						)
						editBuilder.replace(editor_full_range, body.code);
					}).then(() => {
						// make sure its edited
						vscode.window.showInformationMessage(`Obfuscated ${path}`);

						// write content to file and mark line(s)
						const decorationType = vscode.window.createTextEditorDecorationType({
							backgroundColor: '#FF00007F',
							gutterIconPath: '/img/profiler_button.png',
							border: '1px solid white',
							borderRadius: '3px',
							overviewRulerColor: 'red',
							overviewRulerLane: vscode.OverviewRulerLane.Full,
						});

						// find line
						const errLine = openDocument.lineAt(x.line-1);
						let lineRange = errLine.range;

						// remove tabs?
						function countLeadingTabs(str) {
							const match = str.match(/^[\t\s]*/);
							return match ? match[0].length : 0;
						}

						lineRange = new vscode.Range(
							new vscode.Position(
								lineRange.start.line, 
								lineRange.start.character + countLeadingTabs(errLine.text)
							),
							lineRange.end
						)

						// TODO: re-apply decorations when switching tabs!!

						// find the editor that belongs to the document
						const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === openDocument.uri.toString());
						editor.setDecorations(decorationType, [lineRange]);	
					})
					//});
					
				} else {
					const lines = body.code.split('\n');
					if (x.line < 1 || x.line > lines.length) {
						return; // error?
					}
	
					let crashLine = lines[x.line-1];
					let debug = ""
					for (let i=0; i < 10; i++)
					{
						if (i >= 5)
							debug += lines[x.line + (i-5)];
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
					let tokens = []
					if (crashLine.includes("."))
					{
						let dotIndex = crashLine.indexOf(".")
						if (dotIndex !== -1 )
						{
							let substr = crashLine.substring(dotIndex, crashLine.length);
							let len = substr.length
	
							// find end, may it be ' ', '(', '.' or whatever?
							// TODO: use Regex?
							let endIndex = substr.indexOf(" ")
							if (endIndex === -1)
								endIndex = substr.indexOf("(")
							if (endIndex === -1)
								endIndex = substr.indexOf(".")
							if(endIndex !== -1)
								len = endIndex + 1
	
							let possLookup = substr.substr(0, len)
							tokens.push(possLookup)
	
							// now find the token in original source and mark it?
							let index = fileContent.indexOf(possLookup)
	
							// find line by index
							const cleanLines = fileContent.split('\n') // source split
							let indexCount = 0;
							let lineRange = openDocument.lineAt(0).range;
	
							for (let i = 0; i < cleanLines.length; i++)
							{
								const lineLen = cleanLines[i].length
								if (index >= indexCount && index < indexCount + lineLen)
								{
									// found line!
									const errLine = openDocument.lineAt(i);
									lineRange = errLine.range;
									
									// remove tabs?
									function countLeadingTabs(str) {
										const match = str.match(/^[\t\s]*/);
										return match ? match[0].length : 0;
									}
									
									lineRange = new vscode.Range(
										new vscode.Position(
											lineRange.start.line, 
											lineRange.start.character + countLeadingTabs(errLine.text)
										),
										lineRange.end
									)
									break;
								}
								indexCount += lineLen // add line count
							}
	
							
							const decorationType = vscode.window.createTextEditorDecorationType({
								backgroundColor: '#FF00007F',
								gutterIconPath: '/img/profiler_button.png',
								border: '1px solid white',
								borderRadius: '3px',
	
								overviewRulerColor: 'red',
								overviewRulerLane: vscode.OverviewRulerLane.Full,
							});
	
							// find the editor that belongs to the document
							const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === openDocument.uri.toString());
							editor.setDecorations(decorationType, [lineRange]);	
						}
					}
				}
			}
		})
	})
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

	// create helper panel
	let disposable = vscode.commands.registerCommand("lua.helper", () => {
		const column = {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true,
        };

        const options = { 
			enableScripts: true 
		};

		const panel = vscode.window.createWebviewPanel(
			"lua.test",
			"The doctor is in!",
			column,
			options
		);

		//panel.reveal();
		panel.webview.html = getWebviewContent()

		// Handle request from panel
		panel.webview.onDidReceiveMessage(
			message => {
			const regex = /\[string\s+"(.+)"\]:([\d]+):\s+(.+)/g;
			let results = []
			let matches;
			let inspectOnly = false;

			switch (message.command) {
				case 'inspect':
					inspectOnly = true;
				case 'parse':
					while ((matches = regex.exec(message.crashlog))) {
						const [, path, lineNum, message] = matches;
						//console.log(`Path: ${path}, Line: ${lineNum}, Message: ${message}`);
						results.push({path, line: parseInt(lineNum), message});
					}
					
					deobfuscateErrorReport(results, message.config, message.isMinified, inspectOnly)
					return;
			  }
			},
			undefined,
			context.subscriptions
		  );
	})

	/*
	PARSING Wow Errors "\[string\s+"(.+)"\]:([\d]+):\s+(.+)":
```
6358x [string "rotations/druid/restoration/spell..."]:1364: attempt to index local 'v88' (a nil value)
[string "rotations/druid/restoration/spells.lua"]:1364: in function `?'
[string "utils/Spell.lua"]:695: in function `Lifebloom'
[string "rotations/druid/restoration/rotation.lua"]:241: in function <[string "rotations/druid/restoration/rotat..."]:15>
[string "utils/Actor.lua"]:50: in function <[string "utils/Actor.lua"]:49>
[string "utils/tick.lua"]:635: in function <[string "utils/tick.lua"]:473>

Locals:
asd = xxxx
```
	*/

	context.subscriptions.push(disposable);
}
//exports.activate = activate;

// webview for Wow Lua error parsing
function getWebviewContent()
{
	return `<html lang="en"> 
	<head>
		<meta charset="utf-8"/>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			#test {
				display: flex;
				flex-flow: column nowrap;
				justify-content: center;
				align-items: center;
				width: 100%;
				height: 100%;
			}
		</style>
	</head>
	<body>
		<h1>WoW Error Parser</h1>
		<p>
		Please paste your errors below, and make sure to have the correct configuration inserted
		</p>
		<textarea style="color: indianred; background-color: #e0e0; width: 100%" id="crashlog" rows="20" cols="50" ondrop="drop(event)" ondragover="allowDrop(event)"></textarea>
		<textarea style="color: darkcyan; background-color: #e0e0; width: 100%" id="config" rows="6" cols="50"></textarea>
		<br/>
		<button style="background-color: rebeccapurple;" onclick="parseError()">Parse</button>
		<button style="background-color: aliceblue;" onclick="inspectError()">Inspect</button>
		<input type="checkbox" id="isMinified" checked>
		<label for="isMinified">isMinified</label>
		<script>
			const vscode = acquireVsCodeApi();

			function parseError() {
				vscode.postMessage({
					command: 'parse',
					crashlog: document.getElementById('crashlog').value,
					config: document.getElementById('config').value, 
					isMinified: document.getElementById('isMinified').checked, 
				})
			}

			function inspectError() {
				vscode.postMessage({
					command: 'inspect',
					crashlog: document.getElementById('crashlog').value,
					config: document.getElementById('config').value,
					isMinified: true
				})
			}

			function drop(evt) {
				console.log(evt)
			}

			function allowDrop(evt) {
				console.log(evt)
			}
		</script>
	</body>
</html>`;
}

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