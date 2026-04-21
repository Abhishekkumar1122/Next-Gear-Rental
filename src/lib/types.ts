export type VehicleType = "bike" | "car" | "scooty";
export type FuelType = "petrol" | "diesel" | "electric";
export type TransmissionType = "manual" | "automatic";
export type VehicleAvailabilityStatus = "available" | "booked" | "unavailable" | "maintenance" | "crashed";

export type AvailabilitySlot = {
  date: string;
  slots: string[];
};

export type Vehicle = {
  id: string;
  title: string;
  city: string;
  type: VehicleType;
  fuel: FuelType;
  transmission: TransmissionType;
  seats: number;
  pricePerDayINR: number;
  availableDates: string[];
  availabilitySlots?: AvailabilitySlot[];
  vendorId?: string;
  vehicleNumber?: string;
  airportPickup: boolean;
  imageUrls?: string[];
  mileageKmpl?: number;
  engineCc?: number;
  rangeKm?: number;
  rating?: number;
  availabilityStatus?: VehicleAvailabilityStatus;
  availabilityMessage?: string;
  bookedUntil?: string;
  adminNote?: string;
};

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export type BookingAddOnId = "helmet" | "child-seat" | "insurance";

export type BookingAddOn = {
  id: BookingAddOnId;
  label: string;
  pricePerDayINR: number;
  pricePerHourINR: number;
};

export type Booking = {
  id: string;
  vehicleId: string;
  userName: string;
  userEmail: string;
  city: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  rentalHours?: number;
  addons?: BookingAddOnId[];
  subtotalAmountINR?: number;
  couponCode?: string;
  couponDiscountINR?: number;
  referralCode?: string;
  referralDiscountINR?: number;
  promoMessages?: string[];
  totalAmountINR: number;
  currency: "INR" | "USD" | "AED";
  status: BookingStatus;
  createdAt: string;
  timezone: string;
};

export type DeliveryJobType = "delivery" | "pickup";
export type DeliveryJobStatus = "scheduled" | "en_route" | "arrived" | "completed" | "cancelled";

export type DeliveryJob = {
  id: string;
  bookingId: string;
  type: DeliveryJobType;
  status: DeliveryJobStatus;
  scheduledAt?: string;
  assignedDriverId?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  liveLat?: number;
  liveLng?: number;
  lastLocationAt?: string;
  notes?: string;
  otpHint?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Driver = {
  id: string;
  name: string;
  phone?: string;
  vehicleNumber?: string;
  active: boolean;
  currentLat?: number;
  currentLng?: number;
  lastActiveAt?: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "blacklisted";

export type Vendor = {
  id: string;
  businessName: string;
  phone: string;
  commissionRate: number;
  status: ApprovalStatus;
  adminEmail?: string;
  kycDocPath?: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  kycStatus: ApprovalStatus;
  kycDocPath?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  vehicleId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type VendorReview = {
  id: string;
  vendorId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type SupportTicketPriority = "low" | "medium" | "high" | "critical";
export type SupportTicketStatus = "open" | "in-progress" | "resolved" | "closed";
export type SupportTicketCategory = "booking" | "payment" | "vehicle" | "account" | "other";

export type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  vendorId?: string;
  bookingId?: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  attachmentUrls?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

export type TicketReply = {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: "admin" | "customer" | "vendor";
  message: string;
  attachmentUrls?: string[];
  createdAt: string;
};

export type CityConfig = {
  name: string;
  airport: string;
};