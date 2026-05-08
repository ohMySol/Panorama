import { DashboardGraph } from "../src/components/dashboard/dashboard-graph";
import { LeftTab } from "../src/components/dashboard/left-tab";
import { RightTab } from "../src/components/dashboard/right-tab";

export default function DashboardPage() {
  return (
   <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen">
    <LeftTab/>
    <DashboardGraph/>
    <RightTab/>
   </div>
  );
}
