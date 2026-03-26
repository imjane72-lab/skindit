import { NextResponse } from "next/server"
import { getApiDocs } from "@/lib/swagger"

export function GET() {
  return NextResponse.json(getApiDocs())
}
