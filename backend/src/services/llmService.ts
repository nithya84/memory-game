import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.REGION || 'us-east-1' 
});

export interface ThemeDescriptionRequest {
  theme: string;
  style: 'cartoon' | 'realistic' | 'simple';
  count?: number;
}

export interface ThemeDescription {
  subject: string;
  description: string;
}

export async function generateThemeDescriptions(request: ThemeDescriptionRequest): Promise<ThemeDescription[]> {
  const { theme, style, count = 25 } = request;
  
  const prompt = `Generate exactly ${count} diverse, specific, and child-friendly subjects for the theme "${theme}". 
Each should be distinct and recognizable for a memory matching game for children.
Each subject should include a positive or benign adjective.

For each subject, provide:
- subject: The specific name (e.g., "Friendly T-Rex", "Happy Fire truck", "Playful Lion")
- description: Brief educational description starting with the name (e.g., "T-Rex, a dinosaur with tiny arms")

Examples:
- Theme "dinosaurs": "Friendly T-Rex", "Happy Triceratops", "Lovely Stegosaurus", "Curious Pterodactyl"
- Theme "animals": "Friendly Lion", "Gentle Elephant", "Playful Penguin", "Happy Giraffe"
- Theme "vehicles": "Happy Fire truck", "Friendly Police car", "Cheerful School bus", "Helpful Ambulance"

Return as JSON array:
[
  {"subject": "Friendly T-Rex", "description": "T-Rex, a dinosaur with tiny arms"},
  {"subject": "Happy Triceratops", "description": "Triceratops, a dinosaur with three horns"},
  {"subject": "Happy Fire truck", "description": "Fire truck, a red vehicle that fights fires"}
]

Keep descriptions brief and child-friendly.

Theme: "${theme}"
Count: ${count}`;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  };

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract JSON from Claude's response
    const content = responseBody.content[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from LLM response');
    }
    
    const descriptions: ThemeDescription[] = JSON.parse(jsonMatch[0]);
    
    // Ensure we have exactly the requested count
    return descriptions.slice(0, count);
    
  } catch (error) {
    console.error('LLM generation error:', error);
    throw new Error('Failed to generate theme descriptions');
  }
}

export function createMockThemeDescriptions(request: ThemeDescriptionRequest): ThemeDescription[] {
  const { theme, count = 25 } = request;
  
  // Simple mock data for local development
  const mockDescriptions: ThemeDescription[] = [];
  
  for (let i = 1; i <= count; i++) {
    mockDescriptions.push({
      subject: `${theme} ${i}`,
      description: `${theme} ${i}, a ${theme} themed item`
    });
  }
  
  return mockDescriptions;
}