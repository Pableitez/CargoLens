import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import XLSX from "xlsx";

const companyId = new mongoose.Types.ObjectId().toString();

function leanQuery(rows) {
  return {
    select() {
      return this;
    },
    lean: async () => rows,
  };
}

const mockPartyFind = jest.fn();
const mockPartyFindOne = jest.fn();
const mockPartyCreate = jest.fn();
const mockPartyUpdateOne = jest.fn();
const mockPartyFindById = jest.fn();
const mockFacilityFind = jest.fn();
const mockFacilityFindOne = jest.fn();
const mockFacilityCreate = jest.fn();
const mockFacilityUpdateOne = jest.fn();

jest.unstable_mockModule("../../models/Party.js", () => ({
  Party: {
    find: mockPartyFind,
    findOne: mockPartyFindOne,
    create: mockPartyCreate,
    updateOne: mockPartyUpdateOne,
    findById: mockPartyFindById,
  },
}));

jest.unstable_mockModule("../../models/Facility.js", () => ({
  Facility: {
    find: mockFacilityFind,
    findOne: mockFacilityFindOne,
    create: mockFacilityCreate,
    updateOne: mockFacilityUpdateOne,
  },
}));

const { previewTradeMastersImportByKind, importTradeMastersWorkbookByKind, importTradeMastersWorkbook } =
  await import("./tradeMastersImport.js");
const { buildKindImportTemplateBuffer } = await import("./tradeMastersImportTemplate.js");

function partiesWorkbookWithRow(cells) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([["be_code", "party", "country", "city", "address", "vat", "notes"], cells]),
    "parties"
  );
  return workbook;
}

describe("tradeMastersImport integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPartyFind.mockReturnValue(leanQuery([]));
    mockFacilityFind.mockReturnValue(leanQuery([]));
    mockPartyFindOne.mockResolvedValue(null);
    mockPartyCreate.mockImplementation(async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc }));
    mockPartyUpdateOne.mockResolvedValue({ acknowledged: true });
    mockFacilityFindOne.mockResolvedValue(null);
    mockFacilityCreate.mockImplementation(async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc }));
    mockFacilityUpdateOne.mockResolvedValue({ acknowledged: true });
  });

  it("preview parties marks new codes as create", async () => {
    const workbook = partiesWorkbookWithRow([
      "ESNEWCOHQ",
      "New Company Ltd",
      "ES",
      "Madrid",
      "",
      "ESB12345678",
      "",
    ]);
    const result = await previewTradeMastersImportByKind(workbook, companyId, "parties");

    expect(result.ok).toBe(true);
    expect(result.valid).toBe(1);
    expect(result.preview[0].label).toContain("(create)");
  });

  it("preview parties marks existing codes as update", async () => {
    mockPartyFind.mockReturnValue(leanQuery([{ code: "ESEXISTHQ" }]));
    const workbook = partiesWorkbookWithRow(["ESEXISTHQ", "Existing Co", "ES", "", "", "ESB12345678", ""]);
    const result = await previewTradeMastersImportByKind(workbook, companyId, "parties");

    expect(result.valid).toBe(1);
    expect(result.preview[0].label).toContain("(update)");
  });

  it("import parties creates a new operational party", async () => {
    const workbook = partiesWorkbookWithRow([
      "VNIMPORTH",
      "Import Test Co",
      "VN",
      "Hanoi",
      "",
      "VNB12345678",
      "",
    ]);
    const result = await importTradeMastersWorkbookByKind(workbook, companyId, "parties");

    expect(result.ok).toBe(true);
    expect(result.created).toBe(1);
    expect(mockPartyCreate).toHaveBeenCalledTimes(1);
    expect(mockPartyCreate.mock.calls[0][0].code).toBe("VNIMPORTH");
  });

  it("import parties updates an existing operational party", async () => {
    const existingId = new mongoose.Types.ObjectId();
    mockPartyFindOne.mockResolvedValue({
      _id: existingId,
      accountTier: "operational",
      code: "ESUPDATED",
    });
    const workbook = partiesWorkbookWithRow(["ESUPDATED", "Updated Name", "ES", "", "", "ESB12345678", ""]);
    const result = await importTradeMastersWorkbookByKind(workbook, companyId, "parties");

    expect(result.updated).toBe(1);
    expect(mockPartyUpdateOne).toHaveBeenCalledWith(
      { _id: existingId },
      { $set: expect.objectContaining({ legalName: "Updated Name" }) }
    );
  });

  it("preview related_parties fails when party codes are missing", async () => {
    const buffer = buildKindImportTemplateBuffer("related_parties");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const result = await previewTradeMastersImportByKind(workbook, companyId, "related_parties");

    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
    expect(result.preview[0].errors.join(" ")).toMatch(/not found/);
  });

  it("combined import delegates to shared party import helper", async () => {
    const workbook = partiesWorkbookWithRow([
      "ESCOMB01H",
      "Combined Import Co",
      "ES",
      "",
      "",
      "ESB12345678",
      "",
    ]);
    const result = await importTradeMastersWorkbook(workbook, companyId);

    expect(result.ok).toBe(true);
    expect(result.parties.created).toBe(1);
    expect(mockPartyCreate).toHaveBeenCalledTimes(1);
  });
});
