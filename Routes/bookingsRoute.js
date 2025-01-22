const router=require("express").Router()
const authMiddleware = require("../Middlewares/authMiddleware")
const Booking=require("../Models/bookingsModel")
const moment = require('moment');
const Bus = require('../Models/busModel');



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


// Get all bookings
router.post("/get-all-bookings", authMiddleware, async (req, res) => {
  try {
    // Fetch all bookings with populated user and bus data
    const bookings = await Booking.find()
      .populate("user")
      .populate("bus");

    if (!bookings || bookings.length === 0) {
      return res.status(404).send({
        message: "No bookings found",
        success: false,
        data: [],
        totalRevenue: 0, // Return 0 if no bookings
      });
    }

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + booking.seats.length * booking.bus.fare;
    }, 0);

    // Add totalAmount to each booking
    const bookingsWithAmount = bookings.map((booking) => ({
      ...booking.toObject(),
      totalAmount: booking.seats.length * booking.bus.fare,
    }));

    res.status(200).send({
      message: "Bookings fetched successfully",
      success: true,
      data: bookingsWithAmount,
      totalRevenue, // Include total revenue in the response
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send({
      message: "An error occurred while fetching bookings.",
      success: false,
      data: error.message,
      totalRevenue: 0,
    });
  }
});



// Endpoint to fetch total revenue by bus for a specific date
router.post('/get-revenue-by-date', authMiddleware, async (req, res) => {
  const { date } = req.body;

  try {
    // Fetch bookings for the selected date
    const bookings = await Booking.find({
      createdAt: {
        $gte: new Date(date),
        $lt: new Date(date).setDate(new Date(date).getDate() + 1),
      },
    })
      .populate('bus'); // Populate bus details to get the fare

    // Group by bus name and calculate revenue
    const revenueData = bookings.reduce((acc, booking) => {
      const busName = booking.bus.name;
      const fare = booking.bus.fare; // Get the fare from the bus document
      const seatsBooked = booking.seats.length; // Count the booked seats
      const revenue = fare * seatsBooked; // Calculate the revenue

      if (!acc[busName]) {
        acc[busName] = 0;
      }

      acc[busName] += revenue; // Add the revenue for this bus

      return acc;
    }, {});

    // Send the grouped revenue data
    res.status(200).send({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while fetching revenue data for the selected date.',
    });
  }
});





  module.exports = router;

