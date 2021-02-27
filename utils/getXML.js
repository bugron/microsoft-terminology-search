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
            <unique>true</unique>
            <maxTranslations>20</maxTranslations>
            <includeDefinitions>true</includeDefinitions>
        </GetTranslations>
    </soapenv:Body>
</soapenv:Envelope>`;

module.exports = function getXML({
  selectedText,
  languageFrom = 'en-US',
  languageInto = 'ru-RU',
  searchOperator = 'Contains'
}) {
  if (!selectedText) {
    throw new Error('Term is not specified!');
  }

  return xml
    .replace('{{selectedText}}', selectedText)
    .replace('{{languageFrom}}', languageFrom)
    .replace('{{languageInto}}', languageInto)
    .replace('{{searchOperator}}', searchOperator)
};
