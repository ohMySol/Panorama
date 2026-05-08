import Image from "next/image";
import { Hero } from "./src/components/lending/hero";

export default function Home() {
  return (
   <div className="flex flex-col flex-1 px-20">
    <Hero/>
   </div>
  );
}
