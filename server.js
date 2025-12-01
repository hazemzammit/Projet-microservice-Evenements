import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { startScheduler } from "./jobs/scheduler.job.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connecté");

    startScheduler();

    app.listen(process.env.PORT || 3005, () =>
      console.log("Serveur sur http://localhost:" + (process.env.PORT || 3005))
    );
  })
  .catch(err => console.error(err));
