import { LeftTab } from "../src/components/dashboard/left-tab";
import { RightTab } from "../src/components/dashboard/right-tab";

export default function DashboardPage() {
  return (
   <div className="flex flex-1 border-t border-t-gray-400 w-full h-screen">
    <LeftTab/>
    <div className="flex-1"></div>
    <RightTab/>
   </div>
  );
}
