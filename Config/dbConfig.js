const mongoose=require('mongoose')

const connectionString=process.env.connection_string

mongoose.connect(connectionString).then(()=>{
    console.log("Mongodb Atlas connected successfully to easy-bus server");
    
}).catch((err)=>{
    console.log("Mongodb connection failed", err);
    
})

