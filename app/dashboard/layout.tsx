export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return children;
}
