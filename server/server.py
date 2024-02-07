from fastapi import FastAPI, Query
from pydantic import BaseModel
import uvicorn
from fastapi.responses import JSONResponse

from model.dummy_model import generate_bias
from model.llm_bias_detection import analyze_paragraph, get_bias_prediction, setup_openai_api

app = FastAPI()

class Content(BaseModel):
    content: str

@app.get("/api/bias")  
async def analyze_bias(words: str = Query(..., description="Words to analyze for bias")):
    try:
        # IF USING LLM_BIAS_DETECTION.PY
        bias_data = analyze_paragraph(words)

        print("Got here!")

        # OPTIONAL: BIAS THRESHOLD FOR SERVER RESPONSE
        filtered_bias_data = [item for item in bias_data if item['bias_rating']['bias_score'] >= 0.5]


        #IF USING DUMMY_MODEL.PY
        # words_list = words.split()
        # bias_data = {}

        # for index, word in enumerate(words_list):
        #     bias_info = generate_bias(word)
        #     print(bias_info)

        #     # OPTIONAL: BIAS THRESHOLD FOR SERVER RESPONSE
        #     # if bias_info['bias_score'] > 0.1:  
        #     #     bias_data[index] = bias_info

        #     bias_data[index] = bias_info

        print("Filtered data", filtered_bias_data)


        return {"phrase:": words,"content_bias": filtered_bias_data}
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": "Error processing request", "detail": str(e)})

if __name__ == "__main__":
    uvicorn.run("server.server:app", host="127.0.0.1", port=8000, reload=True)

