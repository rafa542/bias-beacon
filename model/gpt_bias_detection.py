
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
def OAI_get_bias_prediction(sentence, client, bias_function):

    response = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {
                "role": "system",
                "content": "You are a bias detection assistant. Make sure to assess negative bias. Do not assess words in quotes. Do not assess names of individuals. Follow the AP Style Guidebook. Assess the bias type and provide a bias score for the text."
            },
            {
                "role": "user",
                "content": f"What is the bias score of the sentence '{sentence}'. If there are any biased words, assess those words."
            }
        ],
        temperature=0,
        # max_tokens = 200,
        functions=bias_function,
        function_call="auto",
    )

    return response.choices[0].message.function_call.arguments


def OAI_analyze_paragraph(sentence):
    
    setup_openai_api()

    client = OpenAI()

    # Function
    bias_function = [{
        "name": "bias_rating",
        "description": "Identify the bias of a given sentence",
        "parameters": {
            "type": "object",
            "properties": {
                "bias_type": {
                    "type": "string",
                    "description": "What is the bias type? Select from: Racial Bias, Linguistic Bias, Gender Bias, Hate Speech, Political Bias, Fake News, None."
                },
                "bias_score": {
                    "type": "integer",
                    "description": "Bias score for the text from 0 to 1. Use 3 significant figures. If the score is 0, output 0."
                }
            },
            "required": ["bias_type", "bias_score"]
        }
    }]

    print("Analyzing sentence for bias:", sentence)
    
    bias_info = OAI_get_bias_prediction(sentence, client, bias_function)
    print("Bias analysis results:", bias_info) 

    # Assuming bias_info_str is a JSON string (the actual format and parsing might differ based on the response)
    bias_info_dict = json.loads(bias_info)

    print("Bias dict:", bias_info_dict)

    # Assuming the response includes a singular bias assessment for the entire sentence
    processed_response = {
        "bias_rating": {
            "bias_type": bias_info_dict["bias_type"],
            "bias_score": bias_info_dict["bias_score"]
        }
    }
    
    return processed_response


if __name__ == "__main__":

    setup_openai_api()

    # print("success f yeah")
    # paragraph = "This was a violent riot."
    # bias_ratings = analyze_paragraph(paragraph)
    # print("\nBIAS RATINGS:\n",bias_ratings)
