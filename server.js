import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
      console.log("MongoDB connecté");
      app.listen(process.env.PORT, () => {
          console.log("Serveur sur http://localhost:" + process.env.PORT);
      });
  })
  .catch(err => console.error(err));
