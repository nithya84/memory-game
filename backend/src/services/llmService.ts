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
  
  const prompt = `Generate exactly ${count} HIGHLY DISTINCTIVE and visually unique subjects for the theme "${theme}". 
Each should be distinct and recognizable for a memory matching game for children.
Each subject should include a positive or benign adjective.

CRITICAL: Avoid similar subjects. Each should have unique visual characteristics that make them immediately recognizable and different from others.

For each subject, provide:
- subject: The specific name (e.g., "Gentle Giant Brontosaurus", "Bright Red Fire Truck", "Striped Orange Tiger")
- description: Detailed visual description for image generation, including distinctive colors, size, shape, and features (e.g., "Gentle Giant Brontosaurus, a massive long-necked dinosaur with green and brown coloring, peaceful expression, and enormously long tail")

Focus on MAXIMUM VISUAL CONTRAST between subjects:

For DINOSAURS: Include variety in size (tiny/medium/huge), body type (long-neck/armored/horned/flying), distinctive features (spikes/frills/crests/claws), and colors
Examples: "Massive Long-necked Brontosaurus", "Tiny Swift Compsognathus", "Armored Spiky Ankylosaurus", "Three-horned Triceratops", "Flying Pterodactyl"

For ANIMALS: Include different habitats, sizes, patterns, colors, and distinctive features
Examples: "Striped Orange Tiger", "Tall Spotted Giraffe", "Black and White Penguin", "Colorful Rainbow Parrot", "Massive Gray Elephant"

For VEHICLES: Include different sizes, colors, purposes, and distinctive features  
Examples: "Bright Red Fire Truck", "Yellow School Bus", "White Ambulance", "Blue Police Car", "Green Garbage Truck"

IMPORTANT: Return ONLY a valid JSON array. No other text. And absolutely no quotation marks or other chars that can break json parsing. Format:
[
  {"subject": "Gentle Giant Brontosaurus", "description": "Gentle Giant Brontosaurus, a massive long-necked dinosaur with green and brown coloring, peaceful expression, enormously long tail, and towering height"},
  {"subject": "Tiny Swift Compsognathus", "description": "Tiny Swift Compsognathus, a small quick dinosaur with bright yellow and orange coloring, alert posture, and running stance"},
  {"subject": "Bright Red Fire Truck", "description": "Bright Red Fire Truck, a large emergency vehicle with shiny red paint, extended ladder, flashing lights, and rescue equipment"}
]

Each description should be detailed enough for distinctive image generation with unique visual characteristics.

Theme: "${theme}"
Count: ${count}`;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 15000,
    system: "You are a JSON generator. You MUST respond with valid JSON only. No other text, explanations, or formatting. Your response must be a valid JSON array that can be parsed directly.",
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
    console.log('LLM raw response:', content);
    
    // Helper function to clean JSON formatting issues
    const cleanJsonString = (jsonString: string): string => {
      return jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
        .replace(/,\s*,/g, ',')        // Remove double commas
        .replace(/"\s*,\s*"/g, '","'); // Fix spacing around commas
    };

    // Try multiple JSON extraction strategies
    let descriptions: ThemeDescription[] = [];
    
    // Strategy 1: Look for JSON array markers
    let startIndex = content.indexOf('[');
    let endIndex = content.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      try {
        const jsonString = cleanJsonString(content.substring(startIndex, endIndex + 1));
        console.log('Extracted JSON string (strategy 1):', jsonString);
        descriptions = JSON.parse(jsonString);
      } catch (parseError) {
        console.log('Strategy 1 failed, trying strategy 2');
      }
    }
    
    // Strategy 2: Use regex to find JSON array
    if (descriptions.length === 0) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const jsonString = cleanJsonString(jsonMatch[0]);
          console.log('Extracted JSON string (strategy 2):', jsonString);
          descriptions = JSON.parse(jsonString);
        } catch (parseError) {
          console.log('Strategy 2 failed, trying strategy 3');
        }
      }
    }
    
    // Strategy 3: Clean and try to parse the entire content
    if (descriptions.length === 0) {
      try {
        // Remove common non-JSON prefixes/suffixes
        let cleanContent = content
          .replace(/^[^[]*/, '') // Remove everything before first [
          .replace(/[^\]]*$/, '') // Remove everything after last ]
          .trim();
        
        if (cleanContent.startsWith('[') && cleanContent.endsWith(']')) {
          const jsonString = cleanJsonString(cleanContent);
          console.log('Extracted JSON string (strategy 3):', jsonString);
          descriptions = JSON.parse(jsonString);
        }
      } catch (parseError) {
        console.log('Strategy 3 failed');
      }
    }
    
    if (descriptions.length === 0) {
      console.error('All JSON extraction strategies failed for response:', content);
      throw new Error('Could not extract valid JSON from LLM response');
    }
    
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