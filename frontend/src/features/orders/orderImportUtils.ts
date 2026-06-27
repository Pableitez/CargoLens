import { downloadBlob } from "../../utils/downloadBlob";
import { api } from "../../api/client.js";

export async function downloadOrdersXlsxTemplate() {
  const { data } = await api.get<Blob>("/orders/import/template", { responseType: "blob" });
  downloadBlob(data, "orders-plantilla.xlsx");
}
