# /home/lychan23/Desktop/Ly.JSxPY/ai/train_model.py
import pandas as pd
import tensorflow as tf
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification, create_optimizer
import numpy as np
from sklearn.model_selection import train_test_split

# Load Sentiment140 dataset
def load_sentiment140_data(data_path="ai/data/sentiment140.csv"):
    df = pd.read_csv(data_path, encoding='latin-1', header=None)
    df.columns = ["target", "ids", "date", "flag", "user", "text"]
    df = df[["text", "target"]]
    df['target'] = df['target'].apply(lambda x: 0 if x == 0 else 1)  # Convert to binary labels
    return df

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained("ai/models/bert-base-uncased")

# Custom function to encode texts
def encode_texts(texts, tokenizer, max_len=512):
    input_ids = []
    attention_masks = []

    for text in texts:
        encoded = tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='np',
        )
        input_ids.append(encoded['input_ids'][0])
        attention_masks.append(encoded['attention_mask'][0])

    return np.array(input_ids), np.array(attention_masks)

# Create TensorFlow datasets
def create_tf_dataset(df, batch_size, tokenizer):
    input_ids, attention_masks = encode_texts(df['text'].tolist(), tokenizer)
    labels = df['target'].values
    dataset = tf.data.Dataset.from_tensor_slices(({
        'input_ids': input_ids,
        'attention_mask': attention_masks
    }, labels))
    dataset = dataset.shuffle(buffer_size=len(df)).batch(batch_size).prefetch(tf.data.experimental.AUTOTUNE)
    return dataset

# Load data
df = load_sentiment140_data("ai/data/sentiment140.csv")

# Split data
train_df, val_df = train_test_split(df, test_size=0.2)

# Create datasets
batch_size = 16
train_dataset = create_tf_dataset(train_df, batch_size, tokenizer)
val_dataset = create_tf_dataset(val_df, batch_size, tokenizer)

# Load model
model = TFAutoModelForSequenceClassification.from_pretrained("ai/models/bert-base-uncased", num_labels=2)

# Define optimizer, loss, and metrics
num_train_steps = len(train_dataset) * 3  # Number of epochs
optimizer, schedule = create_optimizer(
    init_lr=2e-5,
    num_train_steps=num_train_steps,
    num_warmup_steps=0
)
loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
metrics = [tf.keras.metrics.SparseCategoricalAccuracy('accuracy')]

# Compile model
model.compile(optimizer=optimizer, loss=loss, metrics=metrics)

# Train model
model.fit(train_dataset, epochs=3, validation_data=val_dataset)

# Save model
model.save_pretrained("ai/models/bert-finetuned-sentiment140")
tokenizer.save_pretrained("ai/models/bert-finetuned-sentiment140")

# Evaluate model
result = model.evaluate(val_dataset)
print(f'Validation loss: {result[0]}, Validation accuracy: {result[1]}')
