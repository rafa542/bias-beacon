
#Testing OpenAI version - highly sensitive.
import openai
from packaging import version
required_version = version.parse("1.2.0")
current_version = version.parse(openai.__version__)

if current_version < required_version:
    raise ValueError(f"Error: OpenAI version {openai.__version__}"
                     " is less than the required version 1.2.0")
else:
    print("OpenAI version is compatible.")

# -- Now we can get to it
from openai import OpenAI
import json
import os
from dotenv import load_dotenv

# Check if .env has OpenAI API Key
def setup_openai_api():

    # Load environment variables from a .env file
    load_dotenv()

    # Attempt to retrieve the OPENAI_API_KEY environment variable
    api_key = os.getenv("OPENAI_API_KEY")

    if api_key is None:
        raise ValueError("Your .env file doesn't contain an OPENAI_API_KEY.")
    
    # Retreive OpenAI API key
    OpenAI.api_key = api_key

    return OpenAI.api_key


# Function to predict bias for each word in a paragraph
def get_bias_prediction(word, client, bias_function):

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a bias detection assistant. Analyze each word in the provided text for bias."
            },
            {
                "role": "user",
                "content": f"What is the bias score of the word: {word}."
            }
        ],
        # temperature=0.7,
        # max_tokens = 200,
        functions=bias_function,
        function_call="auto",
    )

    return response.choices[0].message.function_call


def analyze_paragraph(paragraph):
    
    setup_openai_api()

    client = OpenAI()

    # Function
    bias_function = [{
        "name": "bias_rating",
        "description": "Identify the bias of the given word",
        "parameters": {
            "type": "object",
            "properties": {
                "bias_score": {
                    "type": "integer",
                    "description": "A bias score from 0 to 1. 3 significant figures. If the score is 0, output 0."
                },
                "bias_reason": {
                    "type": "string",
                    "description": "What is the reason for the bias score? Why is it biased?."
                },
            },
            "required": ["bias_score", "bias_reason"]
        }
    }]

    words = paragraph.split()
    processed_responses = []
    
    for index, word in enumerate(words):
        
        bias_info_str = get_bias_prediction(word, client, bias_function)
        print("Bias!!", bias_info_str)

        # Convert the string response to a dictionary
        bias_info_dict = json.loads(bias_info_str.arguments)

        print(bias_info_dict)

        processed_response = {
            "word_index_in_sentence": index,
            "bias_rating": {
                "word": word,
                "bias_score": bias_info_dict["bias_score"],
                "bias_reason": bias_info_dict["bias_reason"]
            }
        }
        processed_responses.append(processed_response)
    
    return processed_responses


if __name__ == "__main__":

    setup_openai_api()

    # print("success f yeah")
    # paragraph = "This was a violent riot."
    # bias_ratings = analyze_paragraph(paragraph)
    # print("\nBIAS RATINGS:\n",bias_ratings)
