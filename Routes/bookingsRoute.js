const router=require("express").Router()
const authMiddleware = require("../Middlewares/authMiddleware")
const Booking=require("../Models/bookingsModel")
const Bus=require('../Models/busModel')





//book a seat
router.post("/book-seat",authMiddleware, async(req,res)=>{
    try{
        const newBooking= new Booking({...req.body, transactionId:"123", user:req.body.userId})
        await newBooking.save()
        const bus=await Bus.findById(req.body.bus)
        bus.seatsBooked=[...bus.seatsBooked, ...req.body.seats]
        await bus.save()
        res.status(200).send({
            message:"Booking successfull",
            data:newBooking,
            success:true
        })


    }catch(error){
        res.status(500).send({
            message:"Booking failed",
            data:error,
            success:false
        })


    }
})
module.exports=router;