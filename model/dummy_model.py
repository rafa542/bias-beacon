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

    return result

def main():
    """
    The main function that will be called when you run 'poetry run run-model'
    """
    try:
        # Check if an argument is provided
        if len(sys.argv) < 2:
            print("No word provided. Usage: poetry run run-model [word]")
            sys.exit(1)

        word = sys.argv[1]
        bias_info = generate_bias(word)
        print(json.dumps(bias_info))
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()