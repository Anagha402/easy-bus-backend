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
const bookingsRoute=require("./Routes/bookingsRoute")
const paymentRoute=require("./Routes/paymentRoute")
const adminRoute = require('./Routes/adminRoute');




app.use('/api/users',usersRoute)
app.use("/api/buses", busesRoute)
app.use("/api/bookings", bookingsRoute)
app.use("/api/payment", paymentRoute)
app.use('/api/admin', adminRoute);




app.post("/api/test-post", (req, res) => {
    console.log("POST request received at /test-post");
    console.log("Request body:", req.body);
    res.status(200).send("Test POST route is working");
});

app.listen(port,()=>{
    console.log(`Nodejs server listening on port ${port} `);
    
})
app.get('/',(req,res)=>{
    res.send("<h1>server</h1>")
})

