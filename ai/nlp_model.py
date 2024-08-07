# ai/nlp_model.py

import spacy

nlp = spacy.load("en_core_web_sm")

def understand_query(query):
    doc = nlp(query)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    return entities
