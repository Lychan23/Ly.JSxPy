# ai/models/preprocessing.py

import tensorflow as tf
import tensorflow_transform as tft

from models import features

def _fill_in_missing(x):
    """Replace missing values in a SparseTensor.

    Fills in missing values of `x` with '' or 0, and converts to a dense tensor.

    Args:
        x: A `SparseTensor` of rank 2. Its dense shape should have size at most 1
        in the second dimension.

    Returns:
        A rank 1 tensor where missing values of `x` have been filled in.
    """
    if not isinstance(x, tf.sparse.SparseTensor):
        return x

    default_value = '' if x.dtype == tf.string else 0
    return tf.squeeze(
        tf.sparse.to_dense(
            tf.SparseTensor(x.indices, x.values, [x.dense_shape[0], 1]),
            default_value),
        axis=1)

def preprocessing_fn(inputs):
    """tf.transform's callback function for preprocessing inputs.

    Args:
        inputs: map from feature keys to raw not-yet-transformed features.

    Returns:
        Map from string feature key to transformed feature operations.
    """
    outputs = {}
    
    # Tokenize the 'question' text and convert to integers
    question_tokens = tft.compute_and_apply_vocabulary(
        _fill_in_missing(inputs[features.QUESTION_KEY]), 
        top_k=features.VOCAB_SIZE, 
        num_oov_buckets=features.OOV_SIZE)
    
    outputs[features.transformed_name(features.QUESTION_KEY)] = question_tokens

    # Convert the label to an integer
    outputs[features.transformed_name(features.LABEL_KEY)] = tf.cast(
        _fill_in_missing(inputs[features.LABEL_KEY]), tf.int64)
    
    return outputs
