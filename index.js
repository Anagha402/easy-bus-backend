require('dotenv').config()
const express=require('express')
const cors = require('cors');
const app=express();


const dbConfig=require('./Config/dbConfig')

const port=process.env.PORT || 3000;
app.use(express.json())
app.use(cors());

const usersRoute=require('./Routes/usersRoute')
const busesRoute=require('./Routes/busesRoute')
app.use('/api/users',usersRoute)
app.use("/api/buses", busesRoute)
app.listen(port,()=>{
    console.log(`Nodejs server listening on port ${port} `);
    
})
app.get('/',(req,res)=>{
    res.send("<h1>server</h1>")
})

