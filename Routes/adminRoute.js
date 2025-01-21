const router = require('express').Router();
const Booking = require('../Models/bookingsModel');
const User = require('../Models/usersModel');
const authMiddleware = require('../Middlewares/authMiddleware');



// Admin Bookings List
router.post('/admin-bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('user', 'name email') // Populate user details
            .populate('bus', 'name') // Populate bus details (e.g., bus name)
            .exec();

        res.send({
            message: "Bookings fetched successfully",
            success: true,
            data: bookings,
        });
    } catch (error) {
        res.send({
            message: error.message,
            success: false,
            data: null,
        });
    }
});


module.exports = router;
