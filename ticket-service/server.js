const app = require('./app');
const PORT = process.env.PORT || 3033;

app.listen(PORT, () => {
  console.log(`✅ Service Ticket → http://localhost:${PORT}`);
});