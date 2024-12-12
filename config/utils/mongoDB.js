const mongoose=require('mongoose')



const uri="mongodb+srv://adamBlack:UYeRjFjOlBgj8M7h@cluster0.2cninsm.mongodb.net/authDami?retryWrites=true&w=majority"




  const connectDB=async ()=>{
    const conn =await mongoose.connect(uri,{

    });

    console.log(`MongoDB Connected:${mongoose.connection.host}`)
    
}

 

module.exports= {
    connectDB 
}