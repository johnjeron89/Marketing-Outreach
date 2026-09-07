import OpenAI from 'openai';

async function run() {
  const openai = new OpenAI({ 
    apiKey: "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", 
    baseURL: "https://api.groq.com/openai/v1" 
  });
  
  try {
    const res = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("Success with openai/gpt-oss-120b:", res.choices[0].message.content);
  } catch (e: any) {
    console.error("Failed openai/gpt-oss-120b:", e.message);
  }

  try {
    const res = await openai.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("Success with llama-3.1-70b-versatile:", res.choices[0].message.content);
  } catch (e: any) {
    console.error("Failed llama-3.1-70b-versatile:", e.message);
  }
}
run();
