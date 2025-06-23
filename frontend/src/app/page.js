import Image from "next/image";
import axios from "axios";
import { redirect } from "next/navigation";

export default async function Home() {
  try {
    // Try to fetch user info
    await axios.get("/api/users/me", { withCredentials: true });
    redirect("/dashboard");
  } catch {
    redirect("/login");
  }
  return null;
}
