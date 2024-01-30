import random
import json
import sys

#eventually move imports to required file

def generate_bias(word):
    """
    Generate a bias score and reason for a given word.

    :param word: The input word
    :return: JSON object containing the word, bias score, and bias reason
    """
    bias_score = random.random()  # Generate a random score between 0 - 1
    bias_reason = "dummy reason"  

    result = {
        "word": word,
        "bias_score": bias_score,
        "bias_reason": bias_reason
    }

    return json.dumps(result)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python dummy_model.py [word]")
        sys.exit(1)
    
    input_word = sys.argv[1]
    print(generate_bias(input_word))