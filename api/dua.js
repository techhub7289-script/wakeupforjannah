export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { situation, lang, context } = req.body;

  if (!situation) {
    return res.status(400).json({ error: 'Situation required' });
  }

  const prompt = `Tu es un érudit islamique francophone. Génère une dua authentique (issue du Quran ou des hadiths sahih) pour la situation suivante : "${situation}"${context ? `, contexte : "${context}"` : ''}.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "arabic": "le texte arabe de la dua",
  "transliteration": "la translittération phonétique en alphabet latin",
  "translation": "la traduction complète en ${lang || 'français'}",
  "source": "Source : [référence exacte - sourate/verset ou hadith]"
}

Utilise uniquement des duas authentiques des sources islamiques. Ne réponds rien d'autre que le JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const dua = JSON.parse(clean);

    res.status(200).json(dua);
  } catch (err) {
    res.status(500).json({
      arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
      transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhab an-nar",
      translation: "Seigneur, accorde-nous le bien ici-bas et le bien dans l'au-delà, et préserve-nous du châtiment du Feu.",
      source: 'Source : Sourate Al-Baqarah (2:201)'
    });
  }
}
