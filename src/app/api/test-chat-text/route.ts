import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST() {
  console.log('=== TESTING CHAT WITH TEXT ONLY ===');
  
  try {
    console.log('OpenRouter API Key exists:', !!process.env.OPENROUTER_API_KEY);
    
    const result = streamText({
      model: openrouter('google/gemini-flash-1.5'),
      messages: [
        {
          role: 'user',
          content: 'Analyze this simple web application architecture: A user connects to a React frontend, which calls a Node.js API, which connects to a MongoDB database. What are the main security threats?'
        }
      ],
      system: 'You are a security expert. Provide a brief analysis.',
      temperature: 0.7,
    });

    console.log('StreamText result created, returning response');
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('=== TEXT CHAT TEST ERROR ===');
    console.error('Error type:', (error as any)?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Full error object:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as any)?.message || 'Unknown error',
      type: (error as any)?.constructor?.name
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}