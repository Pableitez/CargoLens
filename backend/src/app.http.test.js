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
      expect(res.body.items).toHaveLength(0);
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
  });
});
