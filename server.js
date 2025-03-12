const express = require('express');


// Next initialize the application
const app = express();

// routing path
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Starts the server the 'listen' here has nothing to do with LAMP
//! @rosullivan2, @sarahyoon dont touch this!!
app.listen(3000, () => {
    console.log('Server started on port 3000');
});