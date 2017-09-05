const path = require('path');
const express = require('express');
const {
  renderCallback,
  middleware
} = require('__sku_alias__serverEntry').default;
const port = process.env.PORT || 8080;

const app = express();

app.use(express.static(path.join(__dirname, './')));
if (middleware) {
  app.use(middleware);
}
app.get('*', renderCallback);

app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
