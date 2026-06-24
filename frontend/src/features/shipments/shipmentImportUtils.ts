import { api } from "../../api/client.js";

export async function downloadShipmentsXlsxTemplate() {
  const { data } = await api.get<Blob>("/shipments/import/template", { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "embarques-plantilla.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
