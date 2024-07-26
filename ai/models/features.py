# ai/models/features.py

# Define the feature keys
QUESTION_KEY = 'question'
LABEL_KEY = 'expected_answer'

# Define empty lists for keys and bucket counts to match the test expectations
BUCKET_FEATURE_KEYS = []
BUCKET_FEATURE_BUCKET_COUNT = []

CATEGORICAL_FEATURE_KEYS = []
CATEGORICAL_FEATURE_MAX_VALUES = []

def transformed_name(key):
    return key + '_xf'

def transformed_names(names):
    return [transformed_name(name) for name in names]

VOCAB_SIZE = 1000
OOV_SIZE = 10
