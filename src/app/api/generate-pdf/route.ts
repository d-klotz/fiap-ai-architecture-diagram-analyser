import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { markdown, title } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: 'No markdown content provided' }, { status: 400 });
    }

    // Since we can't use puppeteer-based solutions in Edge runtime,
    // we'll return the markdown and let the client handle PDF generation
    return NextResponse.json({ 
      success: true,
      markdown,
      title: title || 'Architecture Analysis'
    });
  } catch (error) {
    console.error('Error in PDF generation:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}