"use client";

import { useParams } from "next/navigation";
import BookingDetailsView from "@/components/booking/BookingDetailsView";

export default function OwnerBookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;

  return <BookingDetailsView bookingId={bookingId} mode="owner" />;
}
