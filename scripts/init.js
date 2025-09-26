const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('[init] Created data directory at', dataDir);
} else {
  console.log('[init] Data directory exists at', dataDir);
}
