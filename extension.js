//Strings
const CFG_SECTION = 'terminologySearch';
const CFG_FROM = 'TranslateFrom';
const CFG_INTO = 'TranslateInto';
const CFG_OPERATOR = 'SearchOperator';
const CFG_CONFIDENCE = 'ConfidenceLevel';
const CMD_ID = 'extension.terminologySearch';
const xml = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns="http://api.terminology.microsoft.com/terminology">
    <soapenv:Header/>
    <soapenv:Body>
        <GetTranslations>
            <text>{{selectedText}}</text>
            <from>{{languageFrom}}</from>
            <to>{{languageInto}}</to>
            <searchOperator>{{searchOperator}}</searchOperator>
            <sources>
                <TranslationSource>Terms</TranslationSource>
                <TranslationSource>UiStrings</TranslationSource>
            </sources>
            <unique>false</unique>
            <maxTranslations>20</maxTranslations>
            <includeDefinitions>true</includeDefinitions>
        </GetTranslations>
    </soapenv:Body>
</soapenv:Envelope>`;
const soapURL = 'https://api.terminology.microsoft.com/Terminology.svc';

const vscode = require('vscode');
const xml2js = require('xml2js');
const axios = require('axios');

//Activating Function
function activate(context) {
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

//Function to launch the Search URL in default browser
function terminologySearch() {
  const selectedText = getSelectedText();
  if (!selectedText) {
    return;
  }
  const terminologySearchCfg = vscode.workspace.getConfiguration(CFG_SECTION);
  const languageFrom = terminologySearchCfg.get(CFG_FROM);
  const languageInto = terminologySearchCfg.get(CFG_INTO);
  const searchOperator = terminologySearchCfg.get(CFG_OPERATOR);
  const confidenceLevel = terminologySearchCfg.get(CFG_CONFIDENCE);
  const requestXML = xml
    .replace('{{selectedText}}', selectedText)
    .replace('{{languageFrom}}', languageFrom || 'en-US')
    .replace('{{languageInto}}', languageInto || 'ru-RU')
    .replace('{{searchOperator}}', searchOperator || 'Exact');

  console.log('requestXML', requestXML);
  // @ts-ignore
  axios.post(soapURL, requestXML, {
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': 'http://api.terminology.microsoft.com/terminology/Terminology/GetTranslations',
    }
  })
    .then(({ data: xmlData }) => {
      console.log('xmlData', xmlData);
      return xml2js.parseStringPromise(xmlData, { explicitArray: false, ignoreAttrs: true });
    })
    .then(data => {
      const allMatches = data['s:Envelope']['s:Body'].GetTranslationsResponse.GetTranslationsResult.Match;
      console.log('Parsed XML', allMatches);
      const translations = allMatches
        .filter(match => parseInt(match.ConfidenceLevel, 10) >= confidenceLevel)
        .map(match => ({ text: match.OriginalText, translation: match.Translations.Translation.TranslatedText }));
      console.log('translations', translations);
      const panel = vscode.window.createWebviewPanel(
        'terminologySearch', // Identifies the type of the webview. Used internally
        'Terminology Search Results', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      );

      // And set its HTML content
      panel.webview.html = getWebviewContent(translations);
    })
    .catch(err => {
      console.log(err);
      vscode.window.showErrorMessage(
        'An error occured! ' + err.message
      );
    })
  // vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(query));
}


function getWebviewContent(translations) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminology Search Results</title>
</head>
<body>
  <ol>
    ${translations.map(t => `<li>${t.text}: ${t.translation}</li>`).join('\n')}
  </ol>
</body>
</html>`;
}

//getSelectedText creates a URL for search based on the selection
function getSelectedText() {
  const documentText = vscode.window.activeTextEditor.document.getText();
  if (!documentText) {
    return '';
  }
  const activeSelection = vscode.window.activeTextEditor.selection;
  if (activeSelection.isEmpty) {
    return '';
  }
  const selStartoffset = vscode.window.activeTextEditor.document.offsetAt(
    activeSelection.start
  );
  const selEndOffset = vscode.window.activeTextEditor.document.offsetAt(
    activeSelection.end
  );

  let selectedText = documentText.slice(selStartoffset, selEndOffset).trim();
  return selectedText.replace(/\s\s+/g, ' ');
}
