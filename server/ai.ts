import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Generate a summary of a note using Google Gemini AI
 * @param title - The note title
 * @param body - The note body (HTML content)
 * @returns A concise AI-generated summary
 */
export async function generateNoteSummary(title: string, body: string): Promise<string> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your environment variables.');
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Strip HTML tags from body for cleaner processing
    const plainTextBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Create the prompt
    const prompt = `Analyze the following note and provide a concise, informative summary in 2-3 sentences. Focus on the key concepts, main ideas, and important details.

Title: ${title}

Content: ${plainTextBody}

Summary:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return summary.trim();
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid GEMINI_API_KEY. Please check your API key.');
    } else if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your usage limits.');
    }
    
    throw new Error(`Failed to generate summary: ${error.message || 'Unknown error'}`);
  }
}
