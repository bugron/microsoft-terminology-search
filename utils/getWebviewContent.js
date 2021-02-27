module.exports = function getWebviewContent(translations) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      padding: 0;
      margin: 0;
    }
    table {
      max-width: 1024px;
      width: 100%;
      margin: 0 auto;
    }
    table, th, td {
      border: 1px solid black;
    }
    th, td {
      text-align: left;
    }
  </style>
  <title>Terminology Search Results</title>
</head>
<body>
  <table>
    <thead><tr><th>Original text</th><th>Translation</th></tr></thead>
    ${translations.map(t => `<tr><td>${t.text}</td><td>${t.translation}</td></tr>`).join('\n')}
  </table>
</body>
</html>`;
};