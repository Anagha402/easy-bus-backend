const mongoose=require('mongoose')

const bookingSchema= new mongoose.Schema({
    bus:{
        type:mongoose.Schema.ObjectId,
        ref:"buses",
        required:true
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:"users",
        required:true
    },
    seats:{
        type:Array,
        
        required:true
    },
    totalAmount: {
        type: Number, //  field to store the total amount
        required: true,
      },
      passengerDetails: [{
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, required: true }
    }],
    transactionId:{
        type:String,
        
        required:true
    },
     createdAt: {
        type: Date,
         default: Date.now,
    },
    
    



},
{
    timestamps:true
}

)


module.exports=mongoose.model("bookings", bookingSchema)