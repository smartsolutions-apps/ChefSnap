import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, DietaryFilter, PrepTimeFilter, CookTimeFilter, DifficultyFilter } from "../types";

// Helper to get the API client
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Function 1: Analyze the fridge image
export const analyzeFridgeImage = async (base64Image: string): Promise<string[]> => {
  const ai = getAiClient();
  
  // Clean base64 string if needed
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image of an open fridge or pantry. Identify all visible ingredients. Return them as a JSON list of strings. Be specific but concise (e.g., 'Milk', 'Cheddar Cheese', 'Red Bell Pepper'). Ignore non-food items."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const ingredients = JSON.parse(jsonText);
    return Array.isArray(ingredients) ? ingredients : [];
  } catch (error) {
    console.error("Error analyzing fridge:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};

// Function 2: Generate Recipes based on ingredients, pantry, and filters
export const generateRecipes = async (
  detectedIngredients: string[],
  userPantry: string[], // "Smart Pantry" Argument
  filter: DietaryFilter,
  prepTimeFilter: PrepTimeFilter,
  cookTimeFilter: CookTimeFilter,
  difficultyFilter: DifficultyFilter
): Promise<{ recipes: Recipe[], introText: string }> => {
  const ai = getAiClient();

  const dietaryInstruction = filter !== 'None' 
    ? `Strictly adhere to the dietary restriction: ${filter}.` 
    : "No specific dietary restrictions.";
    
  const prepTimeInstruction = prepTimeFilter !== 'Any'
    ? `Strictly ensure the preparation time (excluding cooking) is ${prepTimeFilter}.`
    : "";

  const cookTimeInstruction = cookTimeFilter !== 'Any'
    ? `Strictly ensure the cooking time (active heat/oven time) is ${cookTimeFilter}.`
    : "";

  const difficultyInstruction = difficultyFilter !== 'Any'
    ? `Strictly provide recipes with a difficulty level of '${difficultyFilter}'.`
    : "";

  // Structured Prompt for Strict Logic with Smart Pantry
  const prompt = `
    You are a world-class culinary chef assistant.
    
    [USER INVENTORY]
    1. FRESH SCANNED INGREDIENTS: ${detectedIngredients.join(", ")}.
    2. USER PANTRY STAPLES: The user has these pantry items: ${userPantry.join(", ")}. Treat them as available.
    
    [CONSTRAINTS]
    ${dietaryInstruction}
    ${prepTimeInstruction}
    ${cookTimeInstruction}
    ${difficultyInstruction}
    
    [TASK]
    1. Suggest 5 distinct, delicious recipes.
    2. Prioritize recipes that use the FRESH SCANNED INGREDIENTS.
    3. You are free to use any item from the USER PANTRY STAPLES.
    4. Provide a warm, short, 1-2 sentence introductory message.

    [CRITICAL LOGIC - MISSING INGREDIENTS]
    - The user possesses the following Pantry Items: ${userPantry.join(", ")}. 
    - Treat these items as 'Available'. 
    - Do NOT list pantry items in the 'missingIngredients' section, even if the recipe requires them.
    - 'missingIngredients' should ONLY contain items that are NOT in Fresh Ingredients AND NOT in Pantry Staples.

    Output a JSON object with two properties:
    - "introText": The introductory message string.
    - "recipes": The list of recipe objects.
    
    For each recipe object, include:
    1. A catchy title.
    2. A short appetizing description.
    3. Difficulty, Prep Time, Cook Time, Calories.
    4. Macros: Protein, Carbs, Fat.
    5. Full ingredients list with quantities.
    6. "missingIngredients": The strict list of items to buy (see Critical Logic above).
    7. Step-by-step instructions.
    8. Tags.
    9. "visual_generation_prompts": A concise string listing ONLY the main visual ingredients of the final dish (e.g., "grilled salmon, asparagus, lemon slices"). This is for an image generator.
  `;

  const recipeItemSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      sourceUrl: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
      prepTime: { type: Type.STRING },
      cookTime: { type: Type.STRING },
      calories: { type: Type.STRING },
      protein: { type: Type.STRING },
      carbohydrates: { type: Type.STRING },
      fat: { type: Type.STRING },
      ingredients: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } },
          required: ["name", "quantity"]
        } 
      },
      missingIngredients: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } },
          required: ["name", "quantity"]
        } 
      },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      visual_generation_prompts: { type: Type.STRING, description: "Comma separated list of main visual ingredients for image generation" }
    },
    required: [
      "id", "title", "difficulty", "steps", "ingredients", "missingIngredients", 
      "tags", "protein", "carbohydrates", "fat", "prepTime", "cookTime", "visual_generation_prompts"
    ]
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      introText: { type: Type.STRING },
      recipes: {
        type: Type.ARRAY,
        items: recipeItemSchema
      }
    },
    required: ["introText", "recipes"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText);
    const recipes = Array.isArray(result.recipes) ? result.recipes : [];
    const introText = typeof result.introText === 'string' ? result.introText : "Here are some delicious recipes for you!";

    return { recipes, introText };
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw new Error("Failed to suggest recipes.");
  }
};

// Function 3: Generate Recipe Image
// The Koshary Fix: construct the prompt using ingredients.join(', ')
export const generateRecipeImage = async (title: string, ingredients: string[]): Promise<string | null> => {
  const ai = getAiClient();
  
  // Requirement: Construct prompt using ingredients.join(', ')
  // If 'ingredients' passed here are actually tags (legacy call), this still works reasonably well.
  const prompt = `A professional food photo of ${title} showing these ingredients: ${ingredients.join(', ')}`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3'
      }
    });
    
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64) {
        return `data:image/jpeg;base64,${base64}`;
    }
    return null;
  } catch (error) {
    console.error("Imagen generation error:", error);
    return null;
  }
};