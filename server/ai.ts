import Groq from 'groq-sdk';

// Initialize Groq AI
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * Generate a summary of a note using Groq AI
 * @param title - The note title
 * @param body - The note body (HTML content)
 * @returns A concise AI-generated summary
 */
export async function generateNoteSummary(title: string, body: string): Promise<string> {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured. Please add it to your environment variables.');
  }

  try {
    // Strip HTML tags from body for cleaner processing
    const plainTextBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Create the prompt
    const prompt = `Analyze the following note and provide a concise, informative summary in 2-3 sentences. Focus on the key concepts, main ideas, and important details.

Title: ${title}

Content: ${plainTextBody}

Summary:`;

    // Generate content using Groq (llama3.1 model - fast and free!)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant', // Fast, high-quality, free (non-deprecated)
      temperature: 0.7,
      max_tokens: 200,
    });

    const summary = chatCompletion.choices[0]?.message?.content || '';

    return summary.trim();
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('authentication')) {
      throw new Error('Invalid GROQ_API_KEY. Please check your API key.');
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('Groq API quota exceeded. Please try again later.');
    }
    
    throw new Error(`Failed to generate summary: ${error.message || 'Unknown error'}`);
  }
}
