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

export const runtimeUsers: RuntimeUser[] = [];
export const runtimeOtps: RuntimeOtp[] = [];

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (adminEmail && adminPassword) {
  const existing = runtimeUsers.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  if (existing) {
    existing.role = "ADMIN";
    existing.passwordHash = adminHash;
  } else {
    runtimeUsers.push({
      id: "usr-admin",
      name: "Admin",
      email: adminEmail,
      phone: "",
      passwordHash: adminHash,
      role: "ADMIN",
    });
  }
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