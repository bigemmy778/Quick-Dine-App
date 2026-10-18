import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";


// Get all restaurant for admin management
// GET /api/admin/restaurants

export const getAllRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const restaurants = await Restaurant.find().populate("owner", "name email role").sort({ createdAt: -1 });
        res.json(restaurants);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}

// Approve or reject a restaurant
// PUT /api/admin/restaurants/:id/approve
export const approveRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        if (!status || !["approved", "rejected", "pending"].includes(status)) {
            res.status(400).json({ message: "Please provide a valid status (approved or rejected)" });
            return;
        }
        // find the restaurant
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }

        restaurant.status = status;
        await restaurant.save();
        res.json(restaurant);

    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}


// Get system statistics for admin dashboard
// GET /api/admin/stats
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });   // Count only users with role "user"
        const totalOwners = await User.countDocuments({ role: "owner" }); // Count only users with role "owner"
        const totalBookings = await Booking.countDocuments({ });          // Count all bookings
        const totalRestaurants = await Restaurant.countDocuments({ });    // Count all restaurants

          // Get latest 10 bookings
        const latestBookings = await Booking.find({}).populate("user", "name email").populate("restaurant", "name").sort({ createdAt: -1 }).limit(10);
         
        res.json({ 
            users:{
                totalUsers,
                totalOwners,
                total: totalUsers + totalOwners,
            },
            restaurants: {
                total: totalRestaurants,
            },
            bookings: {
                total: totalBookings,
            },
            latestBookings
         }) 
    } catch (error: any) {

        console.error(error);
        res.status(400).json({ message: error.message });
    }
}