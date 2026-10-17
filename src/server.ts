import mongoose from "mongoose";
import app from "./app"
import { config } from "./app/config";
import { startArchiveExpiryJob } from "./helpers/archiveExpiryJob";

 async function main() {
  await mongoose.connect(config.db_uri as string);

  startArchiveExpiryJob();
   
   app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`); });
  console.log(">>> DEPLOY CHECK: backend build v2");

}

main().then(() => console.log("MongoDB connected successfully!")).catch((error) => {

  console.error("Error connecting to the database:", error);

});

