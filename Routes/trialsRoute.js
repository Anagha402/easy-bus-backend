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
    }).populate('bus'); // Populate bus details to get the fare

    // Group revenue by bus
    const revenueData = bookings.reduce((acc, booking) => {
      const busName = booking.bus.name;
      const fare = booking.bus.fare;
      const seatsBooked = booking.seats.length;
      const revenue = fare * seatsBooked;

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
