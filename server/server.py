from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
import json
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import List

from model.dummy_model import generate_bias
from model.gpt_bias_detection import analyze_paragraph, get_bias_prediction, setup_openai_api

app = FastAPI()

################################
##### Classes
################################

class BiasRating(BaseModel):
    bias_type: str
    bias_score: float

class SentenceAnalysisResult(BaseModel):
    sentence_id: int
    bias_rating: BiasRating

class CacheItem(BaseModel):
    url: str
    date_processed: str
    content: List[SentenceAnalysisResult]

class CacheCheckRequest(BaseModel):
    url: str

class ContentBiasRequest(BaseModel):
    url: str
    sentence_id: int
    sentence: str


################################
##### Cache Setup
################################

# Function to read cache
def read_cache():

    #Load the cache file
    try:
        with open('storage/cache.json', 'r') as f:
            cache_data = json.load(f)
        return cache_data
    except Exception as e:
        raise ValueError("Failed to read cache: " + str(e))
    

# Function to check if URL exists in cache
def check_url_in_cache(url: str):

    try:
        cache_data = read_cache()
        
        # Iterate over the list of objects in the cache data, look for url match
        for item in cache_data:
            if item["url"] == url:
                return item["content"]  # Return the content if URL matches
        
        return None  # Return None if no match is found
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    

def save_to_cache(url: str, sentence_id: int, sentence_text: str, bias_data: dict):
    cache_data = read_cache()
    found = False
    
    for item in cache_data:
        if item["url"] == url:
            found = True
            # Check if sentence_id already exists
            existing_content = next((content for content in item["content"] if content["sentence_id"] == sentence_id), None)
            if existing_content:
                # Update existing content with new bias data and sentence
                existing_content["bias_rating"] = bias_data["bias_rating"]
                existing_content["sentence"] = sentence_text  # Update the sentence text
            else:
                # Append new content with sentence id, sentence text, and bias data
                item["content"].append({
                    "sentence_id": sentence_id,
                    "sentence": sentence_text,  # Include the sentence text
                    **bias_data
                })
            item["date_processed"] = datetime.now().isoformat()
            break
    
    if not found:
        # If URL not found, add new item with sentence id, sentence text, and bias data
        cache_data.append({
            "url": url,
            "date_processed": datetime.now().isoformat(),
            "content": [{
                "sentence_id": sentence_id,
                "sentence": sentence_text,  # Include the sentence text
                **bias_data
            }]
        })
    
    # Save the updated cache data back to file
    with open('storage/cache.json', 'w') as f:
        json.dump(cache_data, f)

################################
##### API Endpoints
################################

@app.post("/api/cache")
async def cache_api(request: CacheCheckRequest):
    try:
        print("REceived request cache", request)
        url = request.url
        cached_content = check_url_in_cache(url)

        if cached_content is not None:

            # Return the cached content if a match is found
            return JSONResponse(content={"isCached": True, "url": url, "content": cached_content}, status_code=200)
        
        else:
            # Return a 404 status code if no cache match is found
            return JSONResponse(content={"isCached": False, "url": url, "message": "URL not found in cache"}, status_code=404)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"message": "Error accessing cache", "detail": e.detail})


@app.post("/api/contentbias")  
async def analyze_bias(request: ContentBiasRequest):
    try:
        print("REceived request analyze", request)
        print("Sending sentence for analysis:", request.sentence)

        # IF USING LLM_BIAS_DETECTION.PY
        bias_data = analyze_paragraph(request.sentence)

        print(bias_data)

        save_to_cache(request.url, request.sentence_id, request.sentence, bias_data)

        # OPTIONAL: BIAS THRESHOLD FOR SERVER RESPONSE
        if bias_data.get('bias_rating', {}).get('bias_score', 0) >= 0.7:
            filtered_bias_data = bias_data['bias_rating']
            
        else:
            # If the bias_score is not >= 0.7, return default values
            filtered_bias_data = {"bias_type": "None", "bias_score": 0.7}

        print("Filtered data", filtered_bias_data)

        return {
            "url": request.url,
            "sentenceIndex": request.sentence_id,
            "sentence": request.sentence,
            "content_bias": filtered_bias_data
        }
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": "Error processing request", "detail": str(e)})
    
@app.get("/health")
def health_check():

    current_time = datetime.now()
    iso_format_time = current_time.isoformat()

    return JSONResponse(content={"message":"Server is live.","time": iso_format_time}, status_code=200)

@app.get("/")
def root():
  return JSONResponse(content={"detail": "Not Found"}, status_code=404)
