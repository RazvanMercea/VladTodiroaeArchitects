import { useEffect } from "react";
import { db } from "@/lib/firebase";

export default function HomePage() {
  useEffect(() => {
    console.log("Firebase connected:", db);
  }, []);

  return <h1>Vlad Todiroaie Architects</h1>;
}
