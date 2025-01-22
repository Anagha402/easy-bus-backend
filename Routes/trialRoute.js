// Get all bookings
router.post("/get-all-bookings", authMiddleware, async (req, res) => {
  try {
    // Fetch all bookings with populated user and bus data
    const bookings = await Booking.find()
      .populate("user") // Populate user data
      .populate("bus"); // Populate bus data

    if (!bookings || bookings.length === 0) {
      return res.status(404).send({
        message: "No bookings found",
        success: false,
        data: [],
      });
    }

    // Add totalAmount to each booking
    const bookingsWithAmount = bookings.map((booking) => ({
      ...booking.toObject(),
      totalAmount: booking.seats.length * booking.bus.fare, // Calculate total amount
    }));

    res.status(200).send({
      message: "Bookings fetched successfully",
      success: true,
      data: bookingsWithAmount,
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


