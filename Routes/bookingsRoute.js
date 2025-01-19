const router=require("express").Router()
const authMiddleware = require("../Middlewares/authMiddleware")
const Booking=require("../Models/bookingsModel")



//get bookings by user id
router.post("/get-bookings-by-user-id", authMiddleware, async(req,res)=>{
    try{
        const bookings = await Booking.find({ user: req.body.userId })
  .populate("bus")
  .populate("user");


  console.log('Populated Bookings:', bookings);

        res.status(200).send({
            message:"Bookings fetched successfully",
            data:bookings,
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













module.exports = router;

