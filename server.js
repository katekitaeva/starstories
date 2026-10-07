import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Redirect root and OperatorHelp base to OperatorHelp/index2.html
app.get('/', (req, res) => {
  res.redirect('/OperatorHelp/index2.html');
});

app.get('/OperatorHelp', (req, res) => {
  res.redirect('/OperatorHelp/index2.html');
});

app.get('/OperatorHelp/', (req, res) => {
  res.redirect('/OperatorHelp/index2.html');
});

// Serve static assets from root
app.use(express.static(__dirname));

// Fallback to OperatorHelp/index2.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'OperatorHelp', 'index2.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening at http://${HOST}:${PORT}`);
});
