const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export async function speakWithElevenLabs(text) {
  try {
    const response = await fetch(`${BACKEND_URL}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Error en /speak');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
    return audio;
  } catch (error) {
    console.error('ElevenLabs error:', error);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

export async function askSarah(message) {
  try {
    const response = await fetch(`${BACKEND_URL}/sarah`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('Error en /sarah');
    const sarahText = response.headers.get('X-Sarah-Response');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
    return { text: sarahText, audio };
  } catch (error) {
    console.error('Sarah error:', error);
    return { text: 'Sorry, I had a connection issue.', audio: null };
  }
}