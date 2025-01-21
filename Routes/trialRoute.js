router.post('/get-bookings-by-date', authMiddleware, async (req, res) => {
  const { date } = req.body;

  console.log('Received Date:', date);

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }

  const formattedDate = moment(date, 'YYYY-MM-DD', true);
  console.log('Formatted Date:', formattedDate.toString(), 'Is Valid:', formattedDate.isValid());

  if (!formattedDate.isValid()) {
    return res.status(400).json({ success: false, message: 'Invalid date format' });
  }

  try {
    const nextDay = formattedDate.clone().add(1, 'days');
    console.log('Query Date Range:', formattedDate.toDate(), nextDay.toDate());

    const bookings = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: formattedDate.toDate(),
            $lt: nextDay.toDate(),
          },
        },
      },
      {
        $group: {
          _id: '$bus',
          totalRevenue: { $sum: '$fare' },
          bookingsCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'buses',
          localField: '_id',
          foreignField: '_id',
          as: 'busData',
        },
      },
      {
        $unwind: '$busData',
      },
    ]);

    console.log('Bookings Data:', bookings);

    const busData = bookings.map((booking) => ({
      busName: booking.busData.name,
      revenue: booking.totalRevenue,
      bookings: booking.bookingsCount,
    }));

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalRevenue, 0);

    res.status(200).json({ success: true, data: { totalRevenue, busData } });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});