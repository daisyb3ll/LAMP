// server.js
const { app, setupApp } = require('./app');
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  setupApp().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  });
}

module.exports = app; // for testing

module.exports = app; // still needed for test access
