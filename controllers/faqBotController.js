const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const { FAQData } = require("../utils/faqData");

const getBestFAQResponse = (message) => {
  try {
    const inputTokens = tokenizer.tokenize(message.toLowerCase());
    let bestMatch = null;
    let highestScore = 0;

    FAQData.forEach((faq) => {
      const faqTokens = tokenizer.tokenize(faq.question.toLowerCase());

      // Calculate TF-IDF similarity
      const tfidf = new natural.TfIdf();
      tfidf.addDocument(faqTokens.join(" "));
      let similarity = 0;
      tfidf.tfidfs(inputTokens.join(" "), (index, measure) => {
        similarity = measure;
      });

      // Combine Jaro-Winkler & TF-IDF
      const jwDistance = natural.JaroWinklerDistance(
        inputTokens.join(" "),
        faqTokens.join(" ")
      );
      const score = similarity * 0.7 + jwDistance * 0.3;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    });

    return highestScore > 0.5
      ? bestMatch.answer
      : "I'm not sure. Can you rephrase?";
  } catch (error) {
    console.error("Error in FAQ bot:", error);
    return null;
  }
};

module.exports = { getBestFAQResponse };
