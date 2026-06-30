import { beforeAll, afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { createApp } from "./app.js";
import { isDbConnected } from "./db.js";
import {
  authHeader,
  clearCollections,
  signTestToken,
  startMemoryDb,
  stopMemoryDb,
} from "./test/httpTestUtils.js";
import { seedPortalAccessFixtures } from "./test/seedPortalAccessFixtures.js";

describe("HTTP integration", () => {
  const app = createApp();

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret-for-http-tests";
  });

  describe("without database", () => {
    it("GET /health returns ok payload", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.timestamp).toBe("string");
      expect(["connected", "disconnected"]).toContain(res.body.db);
    });

    it("GET /api/orders requires authentication", async () => {
      const res = await request(app).get("/api/orders");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("UNAUTHORIZED");
    });

    it("GET /api/unknown returns JSON 404", async () => {
      const res = await request(app).get("/api/unknown-route");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("NOT_FOUND");
    });
  });

  describe("with in-memory MongoDB", () => {
    beforeAll(async () => {
      await startMemoryDb();
    }, 60_000);

    afterAll(async () => {
      await stopMemoryDb();
    }, 30_000);

    beforeEach(async () => {
      await clearCollections();
    });

    it("connects to the in-memory database", () => {
      expect(isDbConnected()).toBe(true);
    });

    it("GET /api/clients returns a paginated list for staff", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const token = signTestToken({
        userId: fixtures.staffUserId,
        companyId: fixtures.company._id,
      });

      const res = await request(app).get("/api/clients").set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        total: 2,
        limit: expect.any(Number),
        skip: 0,
        hasMore: false,
      });
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((row) => row.code).sort()).toEqual(["PORTAL-A", "PORTAL-B"]);
    });

    it("scopes order lists to the portal client contractual party", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const staffToken = signTestToken({
        userId: fixtures.staffUserId,
        companyId: fixtures.company._id,
      });
      const portalToken = signTestToken({
        userId: fixtures.portalUserId,
        companyId: fixtures.company._id,
        clientId: fixtures.clientA._id,
      });

      const staffRes = await request(app).get("/api/orders").set(authHeader(staffToken));
      expect(staffRes.status).toBe(200);
      expect(staffRes.body.items.map((row) => row.orderNumber).sort()).toEqual([
        "ORD-PORTAL-A",
        "ORD-PORTAL-B",
      ]);

      const portalRes = await request(app).get("/api/orders").set(authHeader(portalToken));
      expect(portalRes.status).toBe(200);
      expect(portalRes.body.items).toHaveLength(1);
      expect(portalRes.body.items[0].orderNumber).toBe("ORD-PORTAL-A");
    });

    it("hides another client's order detail from portal users", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const portalToken = signTestToken({
        userId: fixtures.portalUserId,
        companyId: fixtures.company._id,
        clientId: fixtures.clientA._id,
      });

      const res = await request(app).get(`/api/orders/${fixtures.orderB._id}`).set(authHeader(portalToken));

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("NOT_FOUND");
    });

    it("scopes shipper booking lists to the portal client", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const portalToken = signTestToken({
        userId: fixtures.portalUserId,
        companyId: fixtures.company._id,
        clientId: fixtures.clientA._id,
      });

      const res = await request(app).get("/api/shipper-bookings").set(authHeader(portalToken));

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].bookingReference).toBe("SB-PORTAL-A");
    });

    it("scopes carrier booking lists to the portal client", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const portalToken = signTestToken({
        userId: fixtures.portalUserId,
        companyId: fixtures.company._id,
        clientId: fixtures.clientA._id,
      });

      const res = await request(app).get("/api/carrier-bookings").set(authHeader(portalToken));

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].requestReference).toBe("CB-PORTAL-A");
    });

    it("hides another client's carrier booking from portal users", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const portalToken = signTestToken({
        userId: fixtures.portalUserId,
        companyId: fixtures.company._id,
        clientId: fixtures.clientA._id,
      });

      const res = await request(app)
        .get(`/api/carrier-bookings/${fixtures.carrierBookingB._id}`)
        .set(authHeader(portalToken));

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("NOT_FOUND");
    });

    it("creates and submits a carrier booking via mock INTTRA", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const staffToken = signTestToken({
        userId: fixtures.staffUserId,
        companyId: fixtures.company._id,
      });

      const createRes = await request(app)
        .post("/api/carrier-bookings")
        .set(authHeader(staffToken))
        .send({
          shipperBookingIds: [String(fixtures.bookingA._id)],
          carrierScac: "MAEU",
          freightPaymentTerms: "prepaid",
          equipment: [{ quantity: 1, equipmentType: "20GP" }],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.item.status).toBe("draft");
      expect(createRes.body.item.shipperBookingReference).toBe("SB-PORTAL-A");

      const cbId = createRes.body.item.id;
      const submitRes = await request(app)
        .post(`/api/carrier-bookings/${cbId}/submit`)
        .set(authHeader(staffToken));

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.item.status).toBe("acknowledged");
      expect(submitRes.body.item.inttraTransactionId).toMatch(/^MOCK-INTTRA-/);
      expect(submitRes.body.source).toBe("mock");
    });

    it("links and unlinks shipper bookings on carrier booking update", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const staffToken = signTestToken({
        userId: fixtures.staffUserId,
        companyId: fixtures.company._id,
      });

      const createRes = await request(app)
        .post("/api/carrier-bookings")
        .set(authHeader(staffToken))
        .send({
          shipperBookingIds: [String(fixtures.bookingA._id)],
          carrierScac: "MAEU",
          freightPaymentTerms: "prepaid",
          equipment: [{ quantity: 1, equipmentType: "20GP" }],
        });

      expect(createRes.status).toBe(201);
      const cbId = createRes.body.item.id;

      const unlinkRes = await request(app)
        .patch(`/api/carrier-bookings/${cbId}`)
        .set(authHeader(staffToken))
        .send({
          shipperBookingIds: [],
          carrierScac: "MAEU",
          equipment: [{ quantity: 1, equipmentType: "20GP" }],
        });

      expect(unlinkRes.status).toBe(200);
      expect(unlinkRes.body.item.shipperBookingIds).toEqual([]);

      const relinkRes = await request(app)
        .patch(`/api/carrier-bookings/${cbId}`)
        .set(authHeader(staffToken))
        .send({
          shipperBookingIds: [String(fixtures.bookingA._id)],
          refreshFromShipperBookings: true,
          carrierScac: "MAEU",
          equipment: [{ quantity: 1, equipmentType: "20GP" }],
        });

      expect(relinkRes.status).toBe(200);
      expect(relinkRes.body.item.shipperBookingReference).toBe("SB-PORTAL-A");

      const eventsRes = await request(app)
        .get(`/api/carrier-bookings/${cbId}/events`)
        .set(authHeader(staffToken));

      expect(eventsRes.status).toBe(200);
      const messages = eventsRes.body.events.map((event) => event.message);
      expect(messages.some((message) => message.includes("Unlinked shipper booking"))).toBe(true);
      expect(messages.some((message) => message.includes("Linked shipper booking"))).toBe(true);

      const sbRes = await request(app)
        .get(`/api/shipper-bookings/${fixtures.bookingA._id}`)
        .set(authHeader(staffToken));

      expect(sbRes.status).toBe(200);
      expect(sbRes.body.item.linkedCarrierBookingSummary?.requestReference).toBeTruthy();
    });

    it("blocks portal users from staff-only mutations", async () => {
      const fixtures = await seedPortalAccessFixtures();
      const portalToken = signTestToken({
        userId: fixtures.portalUserId,
        companyId: fixtures.company._id,
        clientId: fixtures.clientA._id,
      });

      const res = await request(app)
        .post("/api/orders")
        .set(authHeader(portalToken))
        .send({ orderNumber: "ORD-NEW" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("FORBIDDEN");
    });

    it("POST /api/marketing/pilot-leads stores a pilot lead", async () => {
      const res = await request(app).post("/api/marketing/pilot-leads").send({
        email: "pilot@example.com",
        companyName: "Acme Forwarding",
        name: "Alex",
        locale: "en",
      });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      const again = await request(app).post("/api/marketing/pilot-leads").send({
        email: "pilot@example.com",
        companyName: "Acme Forwarding SL",
      });

      expect(again.status).toBe(200);
      expect(again.body.updated).toBe(true);
    });
  });
});
