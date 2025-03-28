import connectDB from './db/index.js';
import 'dotenv/config';
import { app } from "./app.js";

connectDB()
  .then(()=>{
    app.on("errror", (error) => {
      console.log("ERRR: ", error);
      throw error
    });
    app.listen(process.env.PORT || 8000,()=>{
      console.log("Server is running on port 8080");
    })
  })
  .catch(error =>{
    console.log(error);
  });
