const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../Models/bookingsModel'); // Replace with your Booking model
const authMiddleware = require('../Middlewares/authMiddleware');
const router = express.Router();
const Bus = require('../Models/busModel');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Add in .env file
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Add in .env file
});

// Route to create Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
    let { amount, couponCode } = req.body; // Original amount in rupees

    // Log the amount before any calculation
    console.log("Original amount before discount:", amount);

    // Calculate discount in the backend
    if (couponCode === "DISCOUNT30" && amount > 3000) {
        amount = amount * 0.7; // Apply 30% discount
        console.log(`Discount applied: Final amount after discount: ₹${amount}`);
    }

    try {
        // Log the amount being passed to Razorpay (in paise)
        const amountInPaise = Math.round(amount * 100); // Convert to paise
        console.log("Amount to Razorpay (in paise):", amountInPaise);

        const options = {
            amount: amountInPaise, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        console.log("Razorpay order created successfully:", order);
        res.status(200).send({ success: true, order });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).send({ success: false, message: error.message });
    }
});

// Route to verify Razorpay payment
router.post('/verify-payment', authMiddleware, async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bus,
        user,
        seats,
        amount, // Original amount in rupees
        couponCode,
    } = req.body;

    console.log("Received data for payment verification:", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bus,
        user,
        seats,
        amount,
        couponCode,
    });

    let discountedAmount = amount; // Start with original amount

    // Calculate discount in the backend
    if (couponCode === "DISCOUNT30" && amount > 3000) {
        discountedAmount = amount * 0.7; // Apply 30% discount
        console.log(`Discount applied: Original: ₹${amount}, Discounted: ₹${discountedAmount}`);
    }

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
                totalAmount: discountedAmount, // Save discounted amount
                transactionId: razorpay_payment_id,
            });

            await newBooking.save();
            console.log("Booking saved successfully with discounted amount:", discountedAmount);

            // Update the bus document
            const busData = await Bus.findById(bus);
            if (!busData) {
                console.error("Bus not found!");
                return res.status(404).send({ success: false, message: "Bus not found!" });
            }

            busData.seatsBooked = [...new Set([...busData.seatsBooked, ...seats])]; // Avoid duplicate seats
            await busData.save();

            console.log("Bus data updated successfully with booked seats:", seats);

            res.status(200).send({ success: true, message: "Payment verified, booking confirmed!" });
        } catch (error) {
            console.error("Error saving booking or updating bus:", error.message);
            res.status(500).send({ success: false, message: "Booking save failed!" });
        }
    } else {
        console.error("Invalid payment signature!");
        res.status(400).send({ success: false, message: "Invalid payment signature!" });
    }
});

module.exports = router;
