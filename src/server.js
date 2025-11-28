const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function startServer() {
  let attempt = 0;
  const baseDelay = 2000;
  while (true) {
    try {
      attempt++;
      console.log(`Attempting MongoDB connection (attempt ${attempt})...`);
      await connectDB();
      console.log("MongoDB connection established.");
      break;
    } catch (err) {
      console.error(`MongoDB connection failed: ${err.message}`);
      const delay = Math.min(baseDelay * attempt, 30000); 
      console.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}`);
      console.log(`Retrying in ${delay}ms...`);
     
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`✓ User Service running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`✓ MongoDB URI: ${process.env.MONGO_URI}`);
  });
}

startServer();
