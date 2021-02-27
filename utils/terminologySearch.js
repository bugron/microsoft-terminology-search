const vscode = require('vscode');
const xml2js = require('xml2js');
const axios = require('axios');
const getXML = require('./getXML');
const getSelectedText = require('./getSelectedText');
const getWebviewContent = require('./getWebviewContent');

module.exports = function terminologySearch() {
  const CFG_SECTION = 'terminologySearch';
  const CFG_FROM = 'TranslateFrom';
  const CFG_INTO = 'TranslateInto';
  const CFG_OPERATOR = 'SearchOperator';
  const CFG_CONFIDENCE = 'ConfidenceLevel';
  const soapURL = 'https://api.terminology.microsoft.com/Terminology.svc';

  const selectedText = getSelectedText();
  if (!selectedText) {
    return;
  }

  const terminologySearchCfg = vscode.workspace.getConfiguration(CFG_SECTION);
  const languageFrom = terminologySearchCfg.get(CFG_FROM);
  const languageInto = terminologySearchCfg.get(CFG_INTO);
  const searchOperator = terminologySearchCfg.get(CFG_OPERATOR);
  const confidenceLevel = terminologySearchCfg.get(CFG_CONFIDENCE);
  const requestXML = getXML({
    selectedText,
    languageFrom,
    languageInto,
    searchOperator,
  });

  // @ts-ignore
  axios.post(soapURL, requestXML, {
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': 'http://api.terminology.microsoft.com/terminology/Terminology/GetTranslations',
    }
  })
    .then(({ data }) => {
      return xml2js.parseStringPromise(data, { explicitArray: false, ignoreAttrs: true });
    })
    .then(data => {
      const allMatches = data['s:Envelope']['s:Body'].GetTranslationsResponse.GetTranslationsResult.Match;

      if (!allMatches || !allMatches.length) {
        return vscode.window.showErrorMessage(`No results are found for the term "${selectedText}"`);
      }

      const translations = allMatches
        .filter(match => parseInt(match.ConfidenceLevel, 10) >= confidenceLevel)
        .map(match => ({ text: match.OriginalText, translation: match.Translations.Translation.TranslatedText }));

      if (!translations || !translations.length) {
        return vscode.window.showErrorMessage(`No results are found. Try altering extension's settings`);
      }

      const panel = vscode.window.createWebviewPanel(
        'terminologySearch', // Identifies the type of the webview. Used internally
        selectedText, // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      );

      // And set its HTML content
      panel.webview.html = getWebviewContent(translations);
    })
    .catch(err => {
      vscode.window.showErrorMessage(
        'An error occured! ' + err.message
      );
    })
  // vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(query));
};