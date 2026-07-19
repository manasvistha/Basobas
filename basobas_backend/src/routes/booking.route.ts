import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authorize } from "../middlewears/authorized.middlewears";

const router = Router();
const bookingController = new BookingController();

router.post("/", authorize, bookingController.createBooking.bind(bookingController));
router.get("/my", authorize, bookingController.getMyBookings.bind(bookingController));
router.get("/owner/requests", authorize, bookingController.getOwnerBookingRequests.bind(bookingController));
router.get("/property/:propertyId", authorize, bookingController.getBookingsByProperty.bind(bookingController));
router.get("/:id", authorize, bookingController.getBookingById.bind(bookingController));

// Owner accepts/rejects request
router.put("/:id/status", authorize, bookingController.updateBookingStatus.bind(bookingController));
router.patch("/:id/cancel", authorize, bookingController.cancelMyBooking.bind(bookingController));

export default router;
