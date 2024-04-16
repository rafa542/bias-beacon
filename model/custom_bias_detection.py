import requests
import json

def CUSTOM_get_bias_prediction(sentence):
    try:
        response = requests.post(
            "http://44.203.132.241:8000/run_script",
            headers={"Content-Type": "application/json", "Custom-Header": "YourSystemArgument"},
            data=json.dumps({"args": sentence})
        )
        # Assuming the response is in JSON format
        if response.status_code == 200:
            return response.json()  # Directly return the parsed JSON data
        else:
            print(f"Failed to get a successful response, status code: {response.status_code}")
    except Exception as e:
        print(f"An error occurred: {e}")
    return None

def CUSTOM_analyze_sentence(sentence):
    print("Analyzing sentence for bias with custom model:", sentence)
    
    # Automatically classify short sentences
    if len(sentence) < 80:
        print(f"Sentence is shorter than 50 characters, automatically classifying as 'None' with score 0.")
        processed_response = {
            "bias_rating": {
                "bias_type": "None",
                "bias_score": 0
            }
        }
    else:
        bias_info = CUSTOM_get_bias_prediction(sentence)
    
        if bias_info:
            print("Bias analysis results:", bias_info)
    
            # Find the pair with the highest score
            bias_types, scores = bias_info["output"]
            max_score_index = scores[0].index(max(scores[0]))  # Find index of the highest score in the first (and only) sublist
            max_bias_type = bias_types[0][max_score_index]  # Find corresponding bias type using the index
            max_score = round(scores[0][max_score_index], 2)  # Round the highest score to 2 decimal places
    
            # Preparing the output in the specified format
            processed_response = {
                "bias_rating": {
                    "bias_type": max_bias_type,
                    "bias_score": max_score
                }
            }
        else:
            processed_response = {"error": "Failed to analyze bias."}

    print("Processed response:", processed_response)
    return processed_response
# # Example 
# sentence = "“Now the right-hander will deal the payoff,” Sterling could be heard on his final call. “Strike three is called. Ball game is over. And Yankees win. The Yankees win. They win it 8-3. They defeat Toronto two out of three and they go 8-2.”"
# CUSTOM_analyze_sentence(sentence)