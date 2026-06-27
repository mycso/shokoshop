import { NextResponse } from "next/server";
import { getAllReturns } from "@/lib/returns";

export async function GET() {
  const returns = getAllReturns();
  return NextResponse.json({ returns });
}
