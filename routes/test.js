const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());


// Sample API testing without bearerTokenPresent
app.get('/', (req, res) => {
   res.status(200).send({
      message:'App is working fine!'
   });
});


module.exports = app;
