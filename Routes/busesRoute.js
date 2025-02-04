const router=require('express').Router()
const authMiddleware= require("../Middlewares/authMiddleware")
const Bus=require('../Models/busModel')


//add-bus
router.post('/add-bus',authMiddleware, async(req,res)=>{
    try{
        console.log("Request Body:", req.body);
        const existingBus=await Bus.findOne({number:req.body.number});

        if(existingBus){
            return res.status(200).send({
                success:false,
                message:"Bus already exist"
            })
       }
       const newBus=new Bus(req.body)
       await newBus.save();
       return res.status(200).send({
        success:true,
        message:"Bus added successfully"
       })

    }catch(error){
        res.status(500).send({
            success:false,
            message:error.message
        })

    }
})

//get-all-buses
router.post("/get-all-buses", authMiddleware,  async(req,res)=>{
    try{
        const { from, to, journeyDate } = req.body;

    // Build the filter object dynamically
    const filter = {};
    if (from) filter.from = new RegExp(from, "i"); // Case-insensitive match
    if (to) filter.to = new RegExp(to, "i");
    if (journeyDate) filter.journeyDate = journeyDate;
  
  
        const buses= await Bus.find(filter);
        return res.status(200).send({
            success:true,
            message:"Buses fetched successfully",
            data:buses
        })

    }catch(error){
        res.status(500).send({
            success:false,
            message:error.message
        })

    }
})


//update-bus
router.post("/update-bus", authMiddleware, async(req,res)=>{
    try{
        await Bus.findByIdAndUpdate(req.body._id, req.body)
        return res.status(200).send({
            success:true,
            message:"Bus updated successfully"
        })

    }catch(error){
        res.status(500).send({
            success:false,
            message:error.message
        })
    }
})

//delete-bus
router.post("/delete-bus", authMiddleware, async(req,res)=>{
    try{
        await Bus.findByIdAndDelete(req.body._id)
        return res.status(200).send({
            success:true,
            message:"Bus deleted successfully"
        })

    }catch(error){
        res.status(500).send({
            success:false,
            message:error.message
        })
    }
})

//get-bus-by-id
router.post("/get-bus-by-id", authMiddleware, async(req,res)=>{
    try{
   const bus=await Bus.findById(req.body._id);
   return res.status(200).send({
    success:true,
    message:"Bus fetched successfully",
    data:bus
   })
    }catch(error){
        res.status(500).send({
            success:false,
            message:error.message
        })

    }
})



// Get all buses by bus number
router.get('/api/buses/search',authMiddleware, async (req, res) => {
    const busNumber = req.query.busNumber;
    try {
      // Your logic to find buses by bus number
      const buses = await Bus.find({ busNumber: { $regex: busNumber, $options: 'i' } }); // Regex for search
      res.json(buses);
    } catch (err) {
      console.error('Error fetching buses:', err);
      res.status(500).json({ error: 'Error fetching buses' });
    }
  });





module.exports=router;