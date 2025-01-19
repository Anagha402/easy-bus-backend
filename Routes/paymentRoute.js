const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../Models/bookingsModel'); // Replace with your Booking model
const authMiddleware = require('../Middlewares/authMiddleware');

const router = express.Router();
const Bus=require('../Models/busModel')

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Add in .env file
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Add in .env file
});

// Route to create Razorpay order
router.post('/create-order',authMiddleware, async (req, res) => {
    const { amount } = req.body;

    try {
        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).send({ success: true, order });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});


// Route to verify Razorpay payment
router.post('/verify-payment',authMiddleware, async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bus,
        user,
        seats,
        amount,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        
        
        try {
            // Save booking to MongoDB
            const newBooking = new Booking({
                bus,
                user,
                seats,
                transactionId: razorpay_payment_id,
            });

            await newBooking.save();

            // Update the bus document
        const busData = await Bus.findById(bus);
        if (!busData) {
            console.error("Bus not found");
            return res.status(404).send({ success: false, message: "Bus not found!" });
        }

        busData.seatsBooked = [...new Set([...busData.seatsBooked, ...seats])]; // Avoid duplicate seats
        await busData.save();
        console.log("Bus seats updated successfully");
           
            res.status(200).send({ success: true, message: "Payment verified, booking confirmed!" });
            
            
        } catch (error) {
            res.status(500).send({ success: false, message: "Booking save failed!" });
        }
    } else {
        console.error("Error in verify-payment:", error); // Log the error
        res.status(400).send({ success: false, message: "Invalid payment signature!" });
    }
});

  
module.exports = router;
