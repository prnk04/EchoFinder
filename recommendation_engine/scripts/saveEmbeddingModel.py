from sentence_transformers import SentenceTransformer
import pickle

model = SentenceTransformer("all-MiniLM-L6-v2")

with open('../models/embeddingModel.pkl', 'wb') as f:
    pickle.dump(model, f)