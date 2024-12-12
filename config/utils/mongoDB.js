const mongoose=require('mongoose')
require('dotenv').config();



const uri=process.env.MONGODB_URI 



  const connectDB=async ()=>{
    const conn =await mongoose.connect(uri,{

    });

    console.log(`MongoDB Connected:${mongoose.connection.host}`)
    
}

 

module.exports= {
    connectDB 
}