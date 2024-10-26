"""AI Components Package

This package provides various components for AI-powered answer generation,
data processing, and model management.
"""

from .combined_answer import combined_answer_generation
from .data_processing import DataProcessor
from .enhanced_answer import enhanced_answer_generation
from .fallback_answer import (
    fallback_pipeline, generate_fallback_answer
)
from .model_manager import ModelManager
from .offline_answer import offline_mode
from .generation_utils import (
    generate_context_summary,
    generate_follow_up_questions,
    generate_summary,
    calculate_confidence_score,
    calculate_ner_score,
    filter_and_sort_sentences,
    score_sentence
)
from .utils import (
    check_internet_connection,
    cache_result,
    get_cached_result,
    format_processing_time,
    get_user_preferences,
    apply_user_preferences,
    performance_monitor,
    log_user_feedback,
    print_result,
    add_to_query_history
)

__all__ = [
    # Main components
    'combined_answer_generation',
    'DataProcessor',
    'enhanced_answer_generation',
    'fallback_pipeline',
    'generate_fallback_answer',
    'ModelManager',
    'offline_mode',
    'generate_context_summary',
    'generate_follow_up_questions',
    'generate_summary',
    'calculate_confidence_score',
    'calculate_ner_score',
    'filter_and_sort_sentences',
    'score_sentence',
    
    # Utility components
    'check_internet_connection',
    'cache_result',
    'get_cached_result',
    'format_processing_time',
    'get_user_preferences',
    'apply_user_preferences',
    'performance_monitor',
    'log_user_feedback',
    'print_result',
    'add_to_query_history',

]

# Package metadata
__version__ = '1.2.0'
__author__ = 'Lychan23'
