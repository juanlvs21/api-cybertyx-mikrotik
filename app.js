const express = require('express')
const app = express();
// const cors = require('cors')

const { mongoose } = require('./database/connection');

// Settings
app.set('port', process.env.PORT || 3001);

// Middlerwares
app.use(express.json());
// app.use(cors())

// Access
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Routes
app.use('/api/v1/', require('./routes/routes'));



app.listen(app.get('port'), () => {
    console.log(`Mikrotik API listening on port ${app.get('port')}`)
})