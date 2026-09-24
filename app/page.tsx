import Workspace from "@/components/workspace";
export default function Page() {
  return <Workspace demo={process.env.DEMO_MODE !== "false"} />;
}
