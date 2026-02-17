import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  try {
    const { image, category } = await req.json()

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
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
            ]
          }
        ],
        max_tokens: 150
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Parse "Score: 85/100. Feedback text"
    const scoreMatch = content.match(/Score:\s*(\d+)\/100/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50
    const feedback = content.replace(/Score:\s*\d+\/100\.\s*/, '').trim()

    return new Response(
      JSON.stringify({ score, feedback }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in evaluate-image function:', error)
    // Fallback
    return new Response(
      JSON.stringify({ 
        score: 50, 
        feedback: '⚠️ Sistema en mantenimiento. Recompensa base asignada.' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
})
