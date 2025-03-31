const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const PORT = 3001;
const apiRoutes = require('./routes/index.js');
const app = express();
// permitimos cors en desarrollo *
app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
