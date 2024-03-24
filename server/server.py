from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
import uvicorn
import json
from typing import Optional
from fastapi.responses import JSONResponse

from model.dummy_model import generate_bias
from model.llm_bias_detection import analyze_paragraph, get_bias_prediction, setup_openai_api

app = FastAPI()

################################
##### Cache Setup
################################

class CacheItem(BaseModel):
    url: str
    date_accessed: str
    content: list

# Function to read cache
def read_cache():

    #Load the cache file
    try:
        with open('cache/cache.txt', 'r') as f:
            cache_data = json.load(f)
        return cache_data
    except Exception as e:
        raise ValueError("Failed to read cache: " + str(e))
    

# Function to check if URL exists in cache
def check_url_in_cache(url: str):

    #Check if we can load cache
    try:
        cache_data = read_cache()
        
        # Iterate over the list of objects in the cache data, look for url match
        for item in cache_data:
            if item["url"] == url:
                return True
    
        return False
    
    #Raise error if we can't load cache.
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

################################
##### Content Setup
################################

class Content(BaseModel):
    content: str


################################
##### API Endpoints
################################

@app.get("/api/cache")
async def cache_api(url: str = Query(..., description="Website URL to check in cache")):
    
    try:
        is_cached = check_url_in_cache(url)
        return JSONResponse(content={"isCached": is_cached, "url": url}, status_code=200 if is_cached else 404)
    
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"message": "Error accessing cache", "detail": e.detail, "isCached": False})


@app.get("/api/contentbias")  
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
    
@app.get("/")
def root():
    return JSONResponse(content={"detail": "Not Found"}, status_code=404)

if __name__ == "__main__":
    uvicorn.run("server.server:app", host="127.0.0.1", port=8000, reload=True)

