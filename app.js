const express = require('express');
const app = express();
const port = 8080;
const { rate_limit } = require('./middleware/rate_limit');

app.use(rate_limit);

app.get('/', (req, res) => {
  res.send('HELLO WORLD!');
});
app.listen(port, () => {
  console.log("Server is starting at port: " + port);
});
