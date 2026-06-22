import http from "k6/http";
import { check, sleep } from "k6";

// Define load stages for scaling evaluation
export const options = {
  stages: [
    { duration: "30s", target: 20 },  // Ramp-up to 20 virtual users
    { duration: "1m", target: 20 },   // Stay at 20 VUs for 1 minute
    { duration: "30s", target: 100 }, // Scale up to 100 VUs (stress test)
    { duration: "1m", target: 100 },  // Maintain 100 VUs
    { duration: "30s", target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete under 500ms
    http_req_failed: ["rate<0.01"],    // Less than 1% request failures
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000";
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || "";

export default function () {
  // 1. Browse Homepage (GET /)
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "home page loaded": (r) => r.status === 200,
    "home load time < 300ms": (r) => r.timings.duration < 300,
  });
  sleep(1);

  // 2. Query Catalog Search (GET /api/products?search=premium)
  const searchRes = http.get(`${BASE_URL}/api/products?search=premium&limit=10`);
  check(searchRes, {
    "search api loaded": (r) => r.status === 200,
    "search load time < 200ms": (r) => r.timings.duration < 200,
  });
  sleep(2);

  // 3. View Random Product Detail (GET /api/products/watch-classic)
  const productRes = http.get(`${BASE_URL}/api/products/watch-classic`);
  check(productRes, {
    "product detail api loaded": (r) => r.status === 200 || r.status === 404,
  });
  sleep(1.5);

  // 4. Cart Operations Simulation (GET /api/cart)
  const cartRes = http.get(`${BASE_URL}/api/cart`);
  check(cartRes, {
    "cart retrieval loaded": (r) => r.status === 200,
  });
  sleep(1);

  // 5. Admin API checks (If Admin Authentication token is provided)
  if (ADMIN_TOKEN) {
    const adminHeaders = {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        Cookie: `accessToken=${ADMIN_TOKEN}`,
      },
    };

    const dashboardRes = http.get(`${BASE_URL}/api/admin/dashboard`, adminHeaders);
    check(dashboardRes, {
      "admin dashboard loaded": (r) => r.status === 200,
      "admin response time < 400ms": (r) => r.timings.duration < 400,
    });
  }
}
