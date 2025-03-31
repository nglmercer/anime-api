const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const PORT = 3001;
const animeInfo = require('./routes/animeInfo.js');
const app = express();
// permitimos cors en desarrollo *
app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', animeInfo);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
