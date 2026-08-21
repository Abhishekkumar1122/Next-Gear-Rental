async function benchmarkBooking() {
  const payload = {
    vehicleId: "cmoxak0ck0001l204e1pr2o1l",
    userName: "Abhishek Test",
    userEmail: "abhishek@test.com",
    city: "Delhi",
    startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    quantity: 1,
    paymentProvider: "payu",
    paymentOption: "full",
  };

  const res = await fetch("http://localhost:3000/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Body:", data);
}

benchmarkBooking().catch(console.error);
