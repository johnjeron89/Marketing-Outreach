import OpenAI from 'openai';
const groq = new OpenAI({
  apiKey: "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",
  baseURL: "https://api.groq.com/openai/v1"
});
async function main() {
  try {
    const models = await groq.models.list();
    console.log(models.data.map(m => m.id));
  } catch (err) {
    console.error(err);
  }
}
main();
