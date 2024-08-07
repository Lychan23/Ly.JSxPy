import os
from transformers import TFAutoModel, AutoTokenizer
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV3Large

# Function to create directory if it does not exist
def create_directory(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

# Save BERT base uncased model and tokenizer
def save_bert_base_uncased():
    model_dir = "models/bert-base-uncased"
    create_directory(model_dir)

    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
    model = TFAutoModel.from_pretrained("bert-base-uncased")

    tokenizer.save_pretrained(model_dir)
    model.save_pretrained(model_dir)

    print(f"BERT Base model and tokenizer have been saved to {model_dir}")

# Save DistilGPT-2 model and tokenizer
def save_distilgpt2():
    model_dir = "models/distilgpt2"
    create_directory(model_dir)

    tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
    model = TFAutoModel.from_pretrained("distilgpt2")

    tokenizer.save_pretrained(model_dir)
    model.save_pretrained(model_dir)

    print(f"DistilGPT-2 model and tokenizer have been saved to {model_dir}")

# Save MobileNetV3 model
def save_mobilenetv3():
    model_dir = "models/mobilenetv3"
    create_directory(model_dir)

    # Load MobileNetV3 model (pre-trained) from Keras Applications
    mobilenetv3_model = MobileNetV3Large(weights='imagenet')

    # Print model input shape
    print("Model input shape:", mobilenetv3_model.input_shape)

    # Save the model in native Keras format (.keras)
    keras_model_path = os.path.join(model_dir, "mobilenetv3_model.keras")
    mobilenetv3_model.save(keras_model_path, save_format='keras')

    print(f"MobileNetV3 model has been saved to {keras_model_path}")

# Execute functions
save_bert_base_uncased()
save_distilgpt2()
save_mobilenetv3()
