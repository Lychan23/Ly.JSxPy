# ai/pipeline/pipeline.py
import sys
import os

# Add the parent directory to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from typing import Any, Dict, List, Optional

import tensorflow_model_analysis as tfma
from tfx import v1 as tfx

from ml_metadata.proto import metadata_store_pb2
from models import features

def create_pipeline(
    pipeline_name: str,
    pipeline_root: str,
    data_path: str,
    preprocessing_fn: str,
    run_fn: str,
    train_args: tfx.proto.TrainArgs,
    eval_args: tfx.proto.EvalArgs,
    eval_accuracy_threshold: float,
    serving_model_dir: str,
    schema_path: Optional[str] = None,
    metadata_connection_config: Optional[metadata_store_pb2.ConnectionConfig] = None,
    beam_pipeline_args: Optional[List[str]] = None,
    ai_platform_training_args: Optional[Dict[str, str]] = None,
    ai_platform_serving_args: Optional[Dict[str, Any]] = None,
) -> tfx.dsl.Pipeline:
    """Implements the pipeline with TFX."""

    components = []

    # Brings data into the pipeline or otherwise joins/converts training data.
    example_gen = tfx.components.CsvExampleGen(input_base=data_path)
    components.append(example_gen)

    # Computes statistics over data for visualization and example validation.
    statistics_gen = tfx.components.StatisticsGen(
        examples=example_gen.outputs['examples'])
    components.append(statistics_gen)

    if schema_path is None:
        # Generates schema based on statistics files.
        schema_gen = tfx.components.SchemaGen(
            statistics=statistics_gen.outputs['statistics'])
        components.append(schema_gen)
    else:
        # Import user provided schema into the pipeline.
        schema_gen = tfx.components.ImportSchemaGen(schema_file=schema_path)
        components.append(schema_gen)

    # Performs anomaly detection based on statistics and data schema.
    example_validator = tfx.components.ExampleValidator(
        statistics=statistics_gen.outputs['statistics'],
        schema=schema_gen.outputs['schema'])
    components.append(example_validator)

    # Performs transformations and feature engineering in training and serving.
    transform = tfx.components.Transform(
        examples=example_gen.outputs['examples'],
        schema=schema_gen.outputs['schema'],
        preprocessing_fn=preprocessing_fn)
    components.append(transform)

    # Uses user-provided Python function that implements a model.
    trainer_args = {
        'run_fn': run_fn,
        'examples': transform.outputs['transformed_examples'],
        'schema': schema_gen.outputs['schema'],
        'transform_graph': transform.outputs['transform_graph'],
        'train_args': train_args,
        'eval_args': eval_args,
    }
    if ai_platform_training_args is not None:
        trainer_args['custom_config'] = {
            tfx.extensions.google_cloud_ai_platform.TRAINING_ARGS_KEY: ai_platform_training_args,
        }
        trainer = tfx.extensions.google_cloud_ai_platform.Trainer(**trainer_args)
    else:
        trainer = tfx.components.Trainer(**trainer_args)
    components.append(trainer)

    # Get the latest blessed model for model validation.
    model_resolver = tfx.dsl.Resolver(
        strategy_class=tfx.dsl.experimental.LatestBlessedModelStrategy,
        model=tfx.dsl.Channel(type=tfx.types.standard_artifacts.Model),
        model_blessing=tfx.dsl.Channel(type=tfx.types.standard_artifacts.ModelBlessing)).with_id(
            'latest_blessed_model_resolver')
    components.append(model_resolver)

    # Uses TFMA to compute evaluation statistics over features of a model and
    # perform quality validation of a candidate model (compared to a baseline).
    eval_config = tfma.EvalConfig(
        model_specs=[
            tfma.ModelSpec(
                signature_name='serving_default',
                label_key=features.transformed_name(features.LABEL_KEY),
                preprocessing_function_names=['transform_features'])
        ],
        slicing_specs=[tfma.SlicingSpec()],
        metrics_specs=[
            tfma.MetricsSpec(metrics=[
                tfma.MetricConfig(
                    class_name='BinaryAccuracy',
                    threshold=tfma.MetricThreshold(
                        value_threshold=tfma.GenericValueThreshold(
                            lower_bound={'value': eval_accuracy_threshold}),
                        change_threshold=tfma.GenericChangeThreshold(
                            direction=tfma.MetricDirection.HIGHER_IS_BETTER,
                            absolute={'value': -1e-10})))
            ])
        ])
    evaluator = tfx.components.Evaluator(
        examples=example_gen.outputs['examples'],
        model=trainer.outputs['model'],
        baseline_model=model_resolver.outputs['model'],
        eval_config=eval_config)
    components.append(evaluator)

    # Checks whether the model passed the validation steps and pushes the model
    # to a file destination if check passed.
    pusher_args = {
        'model': trainer.outputs['model'],
        'model_blessing': evaluator.outputs['blessing'],
    }
    if ai_platform_serving_args is not None:
        pusher_args['custom_config'] = {
            tfx.extensions.google_cloud_ai_platform.experimental.PUSHER_SERVING_ARGS_KEY: ai_platform_serving_args
        }
        pusher = tfx.extensions.google_cloud_ai_platform.Pusher(**pusher_args)
    else:
        pusher_args['push_destination'] = tfx.proto.PushDestination(
            filesystem=tfx.proto.PushDestination.Filesystem(
                base_directory=serving_model_dir))
        pusher = tfx.components.Pusher(**pusher_args)
    components.append(pusher)

    return tfx.dsl.Pipeline(
        pipeline_name=pipeline_name,
        pipeline_root=pipeline_root,
        components=components,
        metadata_connection_config=metadata_connection_config,
        beam_pipeline_args=beam_pipeline_args,
    )
