import { Router } from 'express'
import { getFeaturedRestaurants, getRestaurants, 
    getRestaurantsAvailability, getRestaurantsBySlug } 
from '../controllers/restaurantController.js' 

const restaurantRouter = Router();

restaurantRouter.get('/', getRestaurants);
restaurantRouter.get('/featured', getFeaturedRestaurants);
restaurantRouter.get('/:slug', getRestaurantsBySlug);
restaurantRouter.get('/:id/availability', getRestaurantsAvailability);

export default restaurantRouter; 

