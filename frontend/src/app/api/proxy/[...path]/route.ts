import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000/api/v1";
const API_KEY = process.env.API_KEY || "your-api-key-here";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, await req.text());
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, await req.text());
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path, await req.text());
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

async function proxy(req: NextRequest, pathSegments: string[], body?: string) {
  const path = "/" + pathSegments.join("/");
  const search = req.nextUrl.search || "";
  const url = `${BACKEND}${path}${search}`;

  const headers: Record<string, string> = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  };

  const opts: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };
  if (body && ["POST", "PATCH", "PUT"].includes(req.method)) {
    opts.body = body;
  }

  try {
    const res = await fetch(url, opts);
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: err.message },
      { status: 502 }
    );
  }
}
