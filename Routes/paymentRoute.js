const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Booking = require("../Models/bookingsModel");
const Bus = require("../Models/busModel");
const User = require("../Models/usersModel"); // Ensure you import the User model
const authMiddleware = require("../Middlewares/authMiddleware");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Store email credentials in .env
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send ticket details via email
const sendTicketEmail = async (userEmail, busDetails, selectedSeats, amount) => {
    const emailContent = `
        <h2>Booking Confirmation</h2>
        <p>Your booking for <strong>${busDetails.name}</strong> is confirmed.</p>
        <p><strong>From:</strong> ${busDetails.from} <br />
           <strong>To:</strong> ${busDetails.to} <br />
           <strong>Date:</strong> ${busDetails.journeyDate} <br />
           <strong>Departure:</strong> ${busDetails.departure} <br />
           <strong>Seats:</strong> ${selectedSeats.join(", ")} <br />
           <strong>Total Amount Paid:</strong> ₹${amount}
        </p>
        <p>Thank you for choosing Easy Bus!</p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Easy Bus - Booking Confirmation",
        html: emailContent,
    });
};

// Route to create Razorpay order
router.post("/create-order", authMiddleware, async (req, res) => {
    let { amount, couponCode } = req.body;

    console.log("Original amount before discount:", amount);

    if (couponCode === "DISCOUNT30" && amount > 3000) {
        amount = amount * 0.7;
        console.log(`Discount applied: Final amount: ₹${amount}`);
    }

    try {
        const amountInPaise = Math.round(amount * 100);
        console.log("Amount to Razorpay (in paise):", amountInPaise);

        const options = {
            amount: amountInPaise,
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
// router.post("/verify-payment", authMiddleware, async (req, res) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bus, user, seats, amount, couponCode } = req.body;

//     console.log("Received data for payment verification:", {
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//         bus,
//         user,
//         seats,
//         amount,
//         couponCode,
//     });

//     let discountedAmount = amount;
//     if (couponCode === "DISCOUNT30" && amount > 3000) {
//         discountedAmount = amount * 0.7;
//         console.log(`Discount applied: ₹${discountedAmount}`);
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");

//     if (expectedSignature === razorpay_signature) {
//         try {
//             const newBooking = new Booking({
//                 bus,
//                 user,
//                 seats,
//                 totalAmount: discountedAmount,
//                 transactionId: razorpay_payment_id,
//             });

//             await newBooking.save();
//             console.log("Booking saved successfully.");

//             const busData = await Bus.findById(bus);
//             if (!busData) {
//                 return res.status(404).send({ success: false, message: "Bus not found!" });
//             }

//             busData.seatsBooked = [...new Set([...busData.seatsBooked, ...seats])];
//             await busData.save();

//             console.log("Bus data updated successfully.");

//             // Fetch user email
//             const userDetails = await User.findById(user);
//             if (!userDetails) {
//                 return res.status(404).send({ success: false, message: "User not found!" });
//             }

//             await sendTicketEmail(userDetails.email, busData, seats, discountedAmount);

//             res.status(200).send({ success: true, message: "Payment verified, booking confirmed, and email sent!" });
//         } catch (error) {
//             console.error("Error processing booking:", error.message);
//             res.status(500).send({ success: false, message: "Booking failed!" });
//         }
//     } else {
//         res.status(400).send({ success: false, message: "Invalid payment signature!" });
//     }
// });


// Updated route for payment verification to handle passenger details
router.post("/verify-payment", authMiddleware, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bus, user, seats, amount, couponCode, passengerDetails } = req.body;

    console.log("Received data for payment verification:", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bus,
        user,
        seats,
        amount,
        couponCode,
        passengerDetails,  // Log passenger details
    });

    let discountedAmount = amount;
    if (couponCode === "DISCOUNT30" && amount > 3000) {
        discountedAmount = amount * 0.7;
        console.log(`Discount applied: ₹${discountedAmount}`);
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");

    if (expectedSignature === razorpay_signature) {
        try {
            const newBooking = new Booking({
                bus,
                user,
                seats,
                totalAmount: discountedAmount,
                transactionId: razorpay_payment_id,
                passengerDetails, // Save passenger details in the booking
            });

            await newBooking.save();
            console.log("Booking saved successfully.");

            const busData = await Bus.findById(bus);
            if (!busData) {
                return res.status(404).send({ success: false, message: "Bus not found!" });
            }

            busData.seatsBooked = [...new Set([...busData.seatsBooked, ...seats])];
            await busData.save();

            console.log("Bus data updated successfully.");

            const userDetails = await User.findById(user);
            if (!userDetails) {
                return res.status(404).send({ success: false, message: "User not found!" });
            }

            await sendTicketEmail(userDetails.email, busData, seats, discountedAmount);

            res.status(200).send({ success: true, message: "Payment verified, booking confirmed, and email sent!" });
        } catch (error) {
            console.error("Error processing booking:", error.message);
            res.status(500).send({ success: false, message: "Booking failed!" });
        }
    } else {
        res.status(400).send({ success: false, message: "Invalid payment signature!" });
    }
});






module.exports = router;
