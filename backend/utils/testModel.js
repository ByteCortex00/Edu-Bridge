import { pipeline } from '@xenova/transformers';

async function testModel() {
  try {
    console.log('Initializing model...');

    // ✅ Use a model that supports embeddings
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log('Model loaded successfully!');

    // Test texts
    const text1 = 'Software development with Python and algorithms.';
    const text2 = 'Lead designer for UX/UI in product teams.';

    // ✅ Generate embeddings
    const emb1 = await embedder(text1, { pooling: 'mean', normalize: true });
    const emb2 = await embedder(text2, { pooling: 'mean', normalize: true });

    // ✅ Compute cosine similarity
    let similarity = 0;
    for (let i = 0; i < emb1.data.length; i++) {
      similarity += emb1.data[i] * emb2.data[i];
    }

    console.log('Sample Embedding 1:', emb1.data.slice(0, 5));
    console.log('Sample Embedding 2:', emb2.data.slice(0, 5));
    console.log('Similarity Score:', similarity.toFixed(4));
  } catch (error) {
    console.error('Error loading or testing model:', error);
  }
}

testModel();
