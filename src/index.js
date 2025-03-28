import connectDB from './db/index.js';
import 'dotenv/config';
import { app } from "./app.js";

connectDB()
  .then(()=>{
    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error
    });
    app.listen(process.env.PORT || 8000,()=>{
      console.log("Server is running on port ",process.env.PORT);
    })
  })
  .catch(error =>{
    console.log(error);
  });
