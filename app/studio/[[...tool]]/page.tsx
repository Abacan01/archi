import { StudioRedirectClient } from "./studio-redirect-client";

export function generateStaticParams() {
  return [{ tool: [] }];
}

export default function StudioPage() {
  return <StudioRedirectClient />;
}
