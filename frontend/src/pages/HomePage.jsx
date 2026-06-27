import { Navigate, useSearchParams } from "react-router-dom";
import { MarketingHomePage } from "./MarketingHomePage.jsx";

export function HomePage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q")?.trim();
  if (q && q.length >= 4) {
    return <Navigate to={`/track?${searchParams.toString()}`} replace />;
  }
  return <MarketingHomePage />;
}
