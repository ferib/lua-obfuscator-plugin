// Forked from clvbrew
//
// dependencies
const vscode = require('vscode');
const fetch = require('node-fetch');

// constants
const constants = {
	"obfuscate-url": 'https://luaobfuscator.com/api/obfuscator/',
	//"changelog-url": 'https://luaobfuscator.com/api/changelog.txt'
};

// obfuscate button element
let obfuscate = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
obfuscate.command = "lua.obfuscate";
obfuscate.tooltip = "obfuscate current script";
obfuscate.text = "$(book) obfuscate";

/*
// changelog button element
let changelog_ = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
changelog_.command = "lua.changelog";
changelog_.tooltip = "changelog of luaObfuscator";
changelog_.text = "$(book) changelog";
*/

function activate(context) {
	//changelog_.show()
	obfuscate.show()

	let disposable = vscode.commands.registerCommand('lua.obfuscate', function () {
		const settings = vscode.workspace.getConfiguration('lua-obfuscator')
		
		if (!settings || settings['apikey'] == "") {
			vscode.window.showErrorMessage("API Key is necessary for usage of extension!")
			return
		} else if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage("Please open a text file before obfuscating!")
			return
		}

		var text_editor = vscode.window.activeTextEditor

		// notification
		vscode.window.showInformationMessage("Obfuscation starting...")

		// Upload Lua script
		fetch(constants["obfuscate-url"] + "newscript", {
			method: "POST",
			headers: { 
				"Content-Type": "application/json",
				"apikey": settings['apikey']
			},
			body: text_editor.document.getText()
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
			var config = {
				CustomPlugins: {
					ControlFlowFlattenV1AllBlocks: [ settings['ControlFlowFlattenV1AllBlocks'] ],
					//EncryptFuncDeclaration: [ settings['EncryptFuncDeclaration'] ],
					EncryptStrings: [ (settings['EncryptStrings'] ? 100 : 0) ],
					SwizzleLookups: [ (settings['SwizzleLookups'] ? 100 : 0) ],
					MutateAllLiterals: [ (settings['MutateAllLiterals'] ? 100 : 0) ],
				},
				Virtualize: settings['Virtualize']
			}

			if (settings['MinifyAll'])
			{
				config.MinifiyAll = true; // write small-ish
				config.CustomPlugins.Minifier = true; // variable renaming
			}

			fetch(constants["obfuscate-url"] + "Obfuscate", {
				method: "POST",
				headers: { 
					"Content-Type": "application/json",
					"apikey": settings['apikey'],
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
			.then(body => {
				// display error msg?
				if (body.message != null)
				{
					vscode.window.showErrorMessage("Obfuscationed failed!\n--------------\n" + body.message);
					throw Error();
				}

				// determine output type & act on it
				if (settings['outputType'] == 'create new file') {
					vscode.workspace.openTextDocument({"content": `${body.code}`, "language": "lua"})
					vscode.window.showInformationMessage("obfuscated, opening new tab")
				} else if (settings['outputType'] == 'replace current file') {
					// get range object for current editor
					var editor_full_range = new vscode.Range(
						text_editor.document.positionAt(0),
						text_editor.document.positionAt(text_editor.document.getText().length)
					)
					
					// replace current editor text with new text, requires range object
					text_editor.edit(editBuilder => {editBuilder.replace(editor_full_range, body.code)})
					vscode.window.showInformationMessage("obfuscated, and replaced current file")
				} else if (settings['outputType'] == 'copy to clipboard') {
					vscode.env.clipboard.writeText(body.code);
					vscode.window.showInformationMessage("obfuscated, copied to clipboard")
				}
			})
			.catch(function(reason) {
				vscode.window.showErrorMessage("Fatal obfuscation error!")
			})
		})
		.catch(function(reason) {
			vscode.window.showErrorMessage("Failed to upload script!")
			return
		})

	});

	// NOTE: maybe soon?
	/*
	let changelog = vscode.commands.registerCommand('lua.changelog', function() {
		fetch(constants["changelog-url"], {
			method: "GET"
		})
		.then(res => res.text())
		.then(body => {
		    const versions = body.replace(/-/g,"# ").match(/(?:\# ([a-f\.0-9]+?))\[\n*((.*\n)+?)\]/g).reverse()
			
			let out = ""
		    for (let i in versions)
				out += versions[i].replace(/(\[\n)/g, "\n").replace(/(\n\])/g, "\n\n")
			
			vscode.workspace.openTextDocument({ "content": `${out}`, "language": "markdown" })
			vscode.window.showInformationMessage("changelog opened")
		})
	})
	context.subscriptions.push(disposable); context.subscriptions.push(changelog);
	*/
}
//exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	obfuscate.dispose()
	//changelog_.dispose()
}

module.exports = {
	activate,
	deactivate
}