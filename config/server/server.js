const express = require('express');
const { renderCallback, middlewares } = require('serverEntry').default;
const port = process.env.PORT || 8080;

const app = express();

if (
  middlewares &&
  (middlewares instanceof Function ||
    middlewares instanceof express ||
    (middlewares instanceof Array && middlewares.length > 0))
) {
  app.use(middlewares);
}
app.get('*', renderCallback);

app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
