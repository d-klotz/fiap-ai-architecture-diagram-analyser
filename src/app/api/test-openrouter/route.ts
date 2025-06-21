import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST() {
  console.log('=== TESTING OPENROUTER CONNECTION ===');
  
  try {
    console.log('OpenRouter API Key exists:', !!process.env.OPENROUTER_API_KEY);
    console.log('OpenRouter API Key length:', process.env.OPENROUTER_API_KEY?.length || 0);
    
    const result = await generateText({
      model: openrouter('google/gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: 'Say "Hello World" and nothing else.'
        }
      ],
      maxTokens: 10,
    });

    console.log('OpenRouter test successful:', result.text);
    return Response.json({ success: true, response: result.text });
    
  } catch (error) {
    console.error('=== OPENROUTER TEST ERROR ===');
    console.error('Error type:', (error as any)?.constructor?.name);
    console.error('Error message:', (error as any)?.message);
    console.error('Error stack:', (error as any)?.stack);
    return Response.json({ 
      success: false, 
      error: (error as any)?.message || 'Unknown error',
      type: (error as any)?.constructor?.name
    }, { status: 500 });
  }
}