import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  void request;
  const { slug } = await params;
  return NextResponse.json({ message: `Hello ${slug}!` });
}
