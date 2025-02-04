const router=require("express").Router()
const authMiddleware = require("../Middlewares/authMiddleware")
const Booking=require("../Models/bookingsModel")
const moment = require('moment');
const Bus = require('../Models/busModel');



//get bookings by user id
router.post("/get-bookings-by-user-id", authMiddleware, async (req, res) => {
  try {
      const bookings = await Booking.find({ user: req.body.userId })
          .populate("bus")
          .populate("user");

      res.status(200).send({
          message: "Bookings fetched successfully",
          data: bookings,
          success: true
      });
  } catch (error) {
      res.status(500).send({
          message: "Booking failed",
          data: error,
          success: false
      });
  }
});



// Get all bookings

// router.post("/get-all-bookings", authMiddleware, async (req, res) => {
//   try {
//     // Fetch all bookings with populated user and bus data
//     const bookings = await Booking.find()
//       .populate("user")
//       .populate("bus");

//     // Handle case when no bookings are found
//     if (!bookings || bookings.length === 0) {
//       return res.status(404).send({
//         message: "No bookings found",
//         success: false,
//         data: [],
//       });
//     }

//     // Send success response with totalAmount directly from the collection
//     res.status(200).send({
//       message: "Bookings fetched successfully",
//       success: true,
//       data: bookings, // Send the bookings data as is (totalAmount already exists)
//     });
//   } catch (error) {
//     // Log and send error response
//     console.error("Error fetching bookings:", error);
//     res.status(500).send({
//       message: "An error occurred while fetching bookings.",
//       success: false,
//       data: error.message,
//     });
//   }
// });
router.post("/get-all-bookings", authMiddleware, async (req, res) => {
  try {
    // Fetch all bookings with populated user and bus data
    const bookings = await Booking.find()
      .populate("user")
      .populate("bus");

    // Handle case when no bookings are found
    if (!bookings || bookings.length === 0) {
      return res.status(404).send({
        message: "No bookings found",
        success: false,
        data: [],
        totalRevenue: 0, // Return 0 revenue when no bookings
      });
    }

    // Calculate total revenue from all bookings
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalAmount, 0);

    // Send success response with total revenue
    res.status(200).send({
      message: "Bookings fetched successfully",
      success: true,
      data: bookings, // Send the bookings data as is
      totalRevenue, // Add total revenue to the response
    });
  } catch (error) {
    // Log and send error response
    console.error("Error fetching bookings:", error);
    res.status(500).send({
      message: "An error occurred while fetching bookings.",
      success: false,
      data: error.message,
      totalRevenue: 0, // Return 0 revenue in case of error
    });
  }
});





//get revenue by date
//get revenue by date
router.post('/get-revenue-by-date', authMiddleware, async (req, res) => {
  const { date } = req.body;

  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    // Fetch bookings within the selected date
    const bookings = await Booking.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate('bus');

    // Group revenue by bus using totalAmount
    const revenueData = bookings.reduce((acc, booking) => {
      const busName = booking.bus.name;
      const revenue = booking.totalAmount;

      if (!acc[busName]) {
        acc[busName] = 0;
      }

      acc[busName] += revenue;
      return acc;
    }, {});

    res.status(200).send({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while fetching revenue data.',
    });
  }
});




// For Monthly Revenue
router.post('/get-revenue-by-month', authMiddleware, async (req, res) => {
  const { month, year } = req.body;

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const bookings = await Booking.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate('bus');

    // Group revenue by bus using totalAmount
    const revenueData = bookings.reduce((acc, booking) => {
      const busName = booking.bus.name;
      const revenue = booking.totalAmount;

      if (!acc[busName]) {
        acc[busName] = 0;
      }

      acc[busName] += revenue;
      return acc;
    }, {});

    const totalRevenue = Object.values(revenueData).reduce((acc, revenue) => acc + revenue, 0);

    res.status(200).send({
      success: true,
      totalRevenue,
      data: revenueData,
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while fetching revenue data.',
    });
  }
});



// For Yearly Revenue
router.post('/get-revenue-by-year', authMiddleware, async (req, res) => {
  const { year } = req.body;

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const bookings = await Booking.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate('bus');

    // Group revenue by bus using totalAmount
    const revenueData = bookings.reduce((acc, booking) => {
      const busName = booking.bus.name;
      const revenue = booking.totalAmount;

      if (!acc[busName]) {
        acc[busName] = 0;
      }

      acc[busName] += revenue;
      return acc;
    }, {});

    const totalRevenue = Object.values(revenueData).reduce((acc, revenue) => acc + revenue, 0);

    res.status(200).send({
      success: true,
      totalRevenue,
      data: revenueData,
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).send({
      success: false,
      message: 'An error occurred while fetching revenue data.',
    });
  }
});


// API to fetch passenger details based on bus number and journey date
router.post("/passenger-details", authMiddleware, async (req, res) => {
  try {
    const { busNumber, journeyDate } = req.body;

    if (!busNumber || !journeyDate) {
      return res.status(400).json({ message: "Bus number and journey date are required" });
    }

    // Find the bus by number
    const bus = await Bus.findOne({ number: busNumber });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // Validate the journey date
    const date = new Date(journeyDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid journey date format" });
    }

    // Fetch bookings with the matched bus ID and journey date
    const bookings = await Booking.find({
      bus: bus._id,
      createdAt: {
        $gte: date.setHours(0, 0, 0, 0), // Start of the day
        $lt: date.setHours(23, 59, 59, 999), // End of the day
      },
    }).populate("bus");

    if (!bookings.length) {
      return res.status(404).json({ message: "No passengers found for this bus and date" });
    }

    // Extract relevant passenger details
    const passengerDetails = bookings.map((booking) => ({
      seats: booking.seats,
      passengerDetails: booking.passengerDetails.map((passenger, index) => ({
        name: passenger.name,
        age: passenger.age,
        gender: passenger.gender,
        seat: booking.seats[index] || "N/A",
      })),
    }));

    return res.status(200).json({ passengerDetails });
  } catch (error) {
    console.error("Error fetching passenger details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});







 

  







  module.exports = router;