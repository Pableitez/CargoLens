import { downloadBlob } from "../../utils/downloadBlob";
import { api } from "../../api/client.js";

export async function downloadShipperBookingsXlsxTemplate() {
  const { data } = await api.get<Blob>("/shipper-bookings/import/template", { responseType: "blob" });
  downloadBlob(data, "shipper-bookings-plantilla.xlsx");
}
