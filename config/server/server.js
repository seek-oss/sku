const express = require('express');
const {
  renderCallback,
  middleware
} = require('__sku_alias__serverEntry').default;
const port = process.env.PORT || 8080;

const app = express();

if (
  middleware &&
  (middleware instanceof Function ||
    middleware instanceof express ||
    (middleware instanceof Array && middleware.length > 0))
) {
  app.use(middleware);
}
app.get('*', renderCallback);

app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
