import { NextResponse } from "next/server";
import { getAllReturns } from "@/lib/returns";

export async function GET() {
  const returns = await getAllReturns();
  return NextResponse.json({ returns });
}
