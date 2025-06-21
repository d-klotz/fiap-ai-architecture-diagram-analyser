import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { analysisText } = await req.json();

  if (!analysisText) {
    return new Response('Analysis text is required', { status: 400 });
  }

  try {
    console.log('=== TITLE GENERATION START ===');
    console.log('Analysis text provided:', !!analysisText);
    console.log('Analysis text length:', analysisText ? analysisText.length : 'null');
    console.log('Using model: gemini-2.0-flash-exp');

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing software architecture descriptions. Generate a concise, descriptive title (3-6 words) that summarizes the main architecture described in the analysis text. Focus on the key components, patterns, or purpose of the architecture. Return only the title, no markdown formatting needed.'
        },
        {
          role: 'user',
          content: `Generate a title for this architecture based on the following analysis:\n\n${analysisText}`
        }
      ],
      maxTokens: 40,
      temperature: 1,
      maxRetries: 3,
    });

    console.log('=== TITLE GENERATION SUCCESS ===');
    console.log('Generated title:', result.text);
    console.log('Generated title length:', result.text?.length || 0);
    console.log('Token usage:', result.usage);
    console.log('Finish reason:', result.finishReason);

    // Check if we actually got a title
    if (!result.text || result.text.trim().length === 0) {
      console.warn('Generated title is empty or undefined');
      return Response.json({ title: 'Untitled Architecture' });
    }

    return Response.json({ title: result.text.trim() });
  } catch (error) {
    console.error('=== TITLE GENERATION ERROR ===');
    console.error('Error type:', (error as any)?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error code:', (error as any)?.code);
    console.error('Error status:', (error as any)?.status);
    console.error('Error stack:', (error as any)?.stack);
    console.error('Error stringified:', JSON.stringify(error, null, 2));
    console.error('Error keys:', Object.keys(error || {}));

    // Try to extract more details
    if (error && typeof error === 'object') {
      for (const [key, value] of Object.entries(error as any)) {
        console.error(`Error.${key}:`, value);
      }
    }

    // Return detailed error information
    const errorMessage = (error as any)?.message || 'Unknown error';
    const errorStatus = (error as any)?.status || 500;

    return new Response(JSON.stringify({
      error: errorMessage,
      type: (error as any)?.constructor?.name,
      details: 'Check server logs for more information',
      fullError: JSON.stringify(error, null, 2)
    }), {
      status: errorStatus,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}