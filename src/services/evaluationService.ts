import type { EvaluationCategory, EvaluationResult } from '../types/game';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_KEY;

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function evaluateImage(
    imageFile: File,
    category: EvaluationCategory
): Promise<EvaluationResult> {
    try {
        // Validar tamaño
        if (imageFile.size > 5 * 1024 * 1024) {
            throw new Error('La imagen debe ser menor a 5MB');
        }

        // Validar tipo
        if (!['image/png', 'image/jpeg'].includes(imageFile.type)) {
            throw new Error('Solo se permiten imágenes PNG o JPG');
        }

        const base64 = await fileToBase64(imageFile);

        // Llamar directamente a OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Actúa como un profesor amigable de un juego educativo. Tu misión es evaluar la imagen del estudiante. Sin importar el contenido, siempre extrae un valor educativo. Responde estrictamente en este formato: Score: [0-100]/100. [Feedback de 1-2 oraciones en español alentador].'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: `Evalúa esta imagen de categoría: ${category}` },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse "Score: 85/100. Feedback text"
        const scoreMatch = content.match(/Score:\s*(\d+)\/100/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        const feedback = content.replace(/Score:\s*\d+\/100\.\s*/, '').trim();

        return { score, feedback };
    } catch (error) {
        console.error('Error evaluating image:', error);
        return {
            score: 50,
            feedback: '⚠️ Sistema en mantenimiento. Recompensa base asignada.'
        };
    }
}
