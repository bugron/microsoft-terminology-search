const vscode = require('vscode');
const terminologySearch = require('./utils/terminologySearch');

//Activate Function
function activate(context) {
  const CMD_ID = 'extension.terminologySearch';
  const disposable = vscode.commands.registerTextEditorCommand(
    CMD_ID,
    terminologySearch
  );
  context.subscriptions.push(disposable);
}

exports.activate = activate;

//Empty Deactivate Function
function deactivate() {}
exports.deactivate = deactivate;
