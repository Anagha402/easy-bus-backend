const router=require("express").Router()
const authMiddleware = require("../Middlewares/authMiddleware")
const Booking=require("../Models/bookingsModel")
const moment = require('moment');



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
      // Query to fetch all bookings, populated with the 'user' and 'bus' data
      const bookings = await Booking.find()
        .populate("user") // Populate user data (e.g., name, email)
        .populate("bus"); // Populate bus data (e.g., bus name)
  
      // If no bookings found, return a message
      if (!bookings || bookings.length === 0) {
        return res.status(404).send({
          message: "No bookings found",
          success: false,
          data: [],
        });
      }
  
      // Send the bookings data in the response
      res.status(200).send({
        message: "Bookings fetched successfully",
        success: true,
        data: bookings,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).send({
        message: "An error occurred while fetching bookings.",
        success: false,
        data: error.message,
      });
    }
  });

//get-bookings-by-date
router.post('/get-bookings-by-date', authMiddleware, async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }

  try {
    const formattedDate = moment(date, 'YYYY-MM-DD', true);
    if (!formattedDate.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const nextDay = formattedDate.clone().add(1, 'days');

    console.log('Query Date Range:', {
      start: formattedDate.toISOString(),
      end: nextDay.toISOString(),
    });

    const bookings = await Booking.aggregate([
      {
        $lookup: {
          from: 'buses',
          localField: 'bus',
          foreignField: '_id',
          as: 'busData',
        },
      },
      { $unwind: '$busData' },
      {
        $match: {
          'busData.journeyDate': {
            $gte: formattedDate.toDate(),
            $lt: nextDay.toDate(),
          },
        },
      },
      {
        $group: {
          _id: '$bus',
          totalRevenue: { $sum: { $multiply: ['$busData.fare', { $size: '$seats' }] } },
          bookingsCount: { $sum: 1 },
          busName: { $first: '$busData.name' }, // Map bus name
        },
      },
    ]);

    // Initialize variables for total revenue and bus data
    let totalRevenue = 0;
    const busData = [];

    // Loop through the bookings and calculate the total revenue and bus data
    bookings.forEach((booking) => {
      // Push the bus data into the busData array
      busData.push({
        busName: booking.busName,
        revenue: booking.totalRevenue,
        bookings: booking.bookingsCount,
      });

      // Add the revenue for this booking to the total revenue
      totalRevenue += booking.totalRevenue;
    });

    console.log('Bookings Data:', bookings);

    res.status(200).json({ success: true, data: { totalRevenue, busData } });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


  module.exports = router;

