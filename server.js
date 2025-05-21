// server.js
const { app, setupApp } = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

if (process.env.NODE_ENV !== 'test') {
  setupApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });
  });
}

module.exports = app; // still needed for test access
