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
// router.post('/create-order',authMiddleware, async (req, res) => {
//     const { amount } = req.body;

//     try {
//         const options = {
//             amount: amount * 100, // Convert to paise
//             currency: "INR",
//             receipt: `receipt_${Date.now()}`,
//         };

//         const order = await razorpay.orders.create(options);
//         res.status(200).send({ success: true, order });
//     } catch (error) {
//         res.status(500).send({ success: false, message: error.message });
//     }
// });
router.post('/create-order', authMiddleware, async (req, res) => {
    let { amount, couponCode } = req.body; // Original amount in rupees

    // Calculate discount in the backend
    if (couponCode === "DISCOUNT30" && amount > 3000) {
        amount = amount * 0.7; // Apply 30% discount
        console.log(`Discount applied: Final amount: ${amount}`);
    }

    try {
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).send({ success: true, order });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).send({ success: false, message: error.message });
    }
});





// Route to verify Razorpay payment
// router.post('/verify-payment', authMiddleware, async (req, res) => {
//     const {
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//         bus,
//         user,
//         seats,
//         amount,
//         couponCode,
//     } = req.body;

//     let discountedAmount = amount;

//     // Check if DISCOUNT30 coupon code is applied and totalAmount > 3000
//     if (couponCode === "DISCOUNT30" && amount > 3000) {
//         discountedAmount = amount * 0.7; // Apply 30% discount
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(body.toString())
//         .digest("hex");

//     if (expectedSignature === razorpay_signature) {
//         try {
//             // Save booking to MongoDB
//             const newBooking = new Booking({
//                 bus,
//                 user,
//                 seats,
//                 totalAmount: discountedAmount, // Store discounted amount
//                 transactionId: razorpay_payment_id,
//             });

//             await newBooking.save();

//             // Update the bus document
//             const busData = await Bus.findById(bus);
//             if (!busData) {
//                 return res.status(404).send({ success: false, message: "Bus not found!" });
//             }

//             busData.seatsBooked = [...new Set([...busData.seatsBooked, ...seats])]; // Avoid duplicate seats
//             await busData.save();

//             res.status(200).send({ success: true, message: "Payment verified, booking confirmed!" });
//         } catch (error) {
//             res.status(500).send({ success: false, message: "Booking save failed!" });
//         }
//     } else {
//         res.status(400).send({ success: false, message: "Invalid payment signature!" });
//     }
// });
//code with debugging


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

    let discountedAmount = amount; // Start with original amount

    // Calculate discount in the backend
    if (couponCode === "DISCOUNT30" && amount > 3000) {
        discountedAmount = amount * 0.7; // Apply 30% discount
        console.log(`Discount applied: Original: ${amount}, Discounted: ${discountedAmount}`);
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

            // Update the bus document
            const busData = await Bus.findById(bus);
            if (!busData) {
                return res.status(404).send({ success: false, message: "Bus not found!" });
            }

            busData.seatsBooked = [...new Set([...busData.seatsBooked, ...seats])]; // Avoid duplicate seats
            await busData.save();

            console.log(
                `Booking saved successfully with discounted amount: ${discountedAmount}`
            );
            res.status(200).send({ success: true, message: "Payment verified, booking confirmed!" });
        } catch (error) {
            console.error("Error saving booking:", error);
            res.status(500).send({ success: false, message: "Booking save failed!" });
        }
    } else {
        res.status(400).send({ success: false, message: "Invalid payment signature!" });
    }
});




  
module.exports = router;