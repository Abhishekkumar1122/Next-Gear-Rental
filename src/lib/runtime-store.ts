import bcrypt from "bcryptjs";

type RuntimeUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
};

type RuntimeOtp = {
  email: string;
  codeHash: string;
  expiresAt: Date;
  used: boolean;
};

export type RuntimeBooking = {
  id: string;
  vehicleId: string;
  vehicleTitle?: string;
  vehicleType?: string;
  userName: string;
  userEmail: string;
  phone?: string;
  city: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  totalAmountINR: number;
  currency: string;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
  handoverStatus?: string;
};

export const runtimeUsers: RuntimeUser[] = [];
export const runtimeOtps: RuntimeOtp[] = [];
export const runtimeBookings: RuntimeBooking[] = [];

const adminEmail = process.env.ADMIN_EMAIL || "admin@next-gear.app";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@NextGear2026";

const existing = runtimeUsers.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
const adminHash = bcrypt.hashSync(adminPassword, 10);

if (existing) {
  existing.role = "ADMIN";
  existing.passwordHash = adminHash;
} else {
  runtimeUsers.push({
    id: "usr-admin-default",
    name: "Next Gear Super Admin",
    email: adminEmail,
    phone: "9523765172",
    passwordHash: adminHash,
    role: "ADMIN",
  });
}

// Pre-configured test vendor user
const vendorHash = bcrypt.hashSync("Vendor@123", 10);
runtimeUsers.push({
  id: "usr-vendor-1",
  name: "Test Vendor Manager",
  email: "vendor@example.com",
  phone: "9000011111",
  passwordHash: vendorHash,
  role: "VENDOR",
});