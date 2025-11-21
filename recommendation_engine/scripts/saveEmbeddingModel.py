from sentence_transformers import SentenceTransformer
import pickle

model = SentenceTransformer("all-MiniLM-L6-v2")

# for gpu  machine
# with open("../models/embeddingModel.pkl", "wb") as f:
#     pickle.dump(model, f)

# for cpu machine
model.save("../rec_models/embeddingModel")
