import { AuthRequest } from "../middlewares/auth.js";
import { Booking } from "../models/Booking.js";
import { Restaurant } from "../models/Restaurant.js";
import { Response } from "express";

// Create a new booking
//POST /api/bookings
// @access Provate

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {

        const { restaurantId, date, time, guests, occasion, specialRequests } = req.body;
        if (!restaurantId || !date || !time || !guests) {
            res.status(400).json({ message: "Please provide all required reservation details" });
            return;
        }

        // Check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId)
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }


        // Verify restaurant is approved
        if (restaurant.status !== "approved") {
            res.status(400).json({ message: "Restaurant are not open for this restaurant yet" });
            return;
        }

        // verify seat availability 
        const requestedGuests = Number(guests);

        const existingBookings = await Booking.find({
            restaurant: restaurantId,
            date: new Date(date),
            time: time,
            status: "confirmed"
        })

        const bookedSeats = existingBookings.reduce((sum, b) => sum + b.guests, 0);

        const totalSeats = restaurant.totalSeats || 20;

        const availableSeats = Math.max(0, totalSeats - bookedSeats);

        if (requestedGuests > availableSeats) {
            res.status(400).json({ message: `unable to reserve. Only ${availableSeats} seats are available for this time slot.` });
            return;
        }



        // Create booking
        const booking = await Booking.create({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time,
            guests: requestedGuests,
            occasion,
            specialRequests,
            status: "confirmed"
        });

        //Populate user and restaurant  info before returning
        const populateBooking = await booking.populate("restaurant", "name location image");

        res.status(201).json(populateBooking);
   
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}

//Get logged in user bookings
//Get /api/bookings/my
// @access Provate

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {

    try {
       const bookings = await Booking.find({ user: req.user?._id }).populate("restaurant", "name location image address slug").sort({ date: -1, time: 1 });

       res.json(bookings);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}


// Cancel a booking
//PUT /api/bookings/:id/cancel
// @access Provate

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        
       const booking = await Booking.findById(req.params.id); 

       if(!booking){
        res.status(404).json({ message: "Booking not found" });
        return;
       }

       // verify user owns the booking
       if(booking.user.toString() !== req.user?._id.toString()){
        res.status(401).json({ message: "Access denied, you can only cancel your own bookings" });
        return;
       }

       booking.status = "cancelled";
       await booking.save();

       const populateBooking = await booking.populate("restaurant", "name location image address slug");
       res.json(populateBooking);
    
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}

