import sys
import os

# Add the parent directory to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import tensorflow as tf
from models import features

class FeaturesTest(tf.test.TestCase):

    def testNumberOfBucketFeatureBucketCount(self):
        # Ensure BUCKET_FEATURE_KEYS and BUCKET_FEATURE_BUCKET_COUNT have the same length
        self.assertEqual(
            len(features.BUCKET_FEATURE_KEYS),
            len(features.BUCKET_FEATURE_BUCKET_COUNT))
        
        # Ensure CATEGORICAL_FEATURE_KEYS and CATEGORICAL_FEATURE_MAX_VALUES have the same length
        self.assertEqual(
            len(features.CATEGORICAL_FEATURE_KEYS),
            len(features.CATEGORICAL_FEATURE_MAX_VALUES))

    def testTransformedNames(self):
        # Check the transformed names for the given list
        names = ["f1", "cf"]
        self.assertEqual(["f1_xf", "cf_xf"], features.transformed_names(names))
    
    def testQuestionKey(self):
        # Check that QUESTION_KEY is correctly defined
        self.assertEqual(features.QUESTION_KEY, 'question')
    
    def testLabelKey(self):
        # Check that LABEL_KEY is correctly defined
        self.assertEqual(features.LABEL_KEY, 'expected_answer')

if __name__ == "__main__":
    tf.test.main()
