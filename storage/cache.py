# This will be the caching script, eventually


schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "website_cache",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "The URL of the website being analyzed."
    },
    "date_accessed": {
      "type": "string",
      "format": "date-time",
      "description": "The date and time when the content was accessed."
    },
    "content": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sentence_id": {
            "type": "integer",
            "description": "A unique identifier for each sentence or piece of content."
          },
          "text": {
            "type": "string",
            "description": "The actual sentence or piece of content."
          },
          "word_details": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "word_index_in_sentence": {
                  "type": "integer",
                  "description": "The position of the word within the sentence."
                },
                "bias_rating": {
                  "type": "object",
                  "properties": {
                    "word": {
                      "type": "string",
                      "description": "The word being analyzed."
                    },
                    "bias_score": {
                      "type": "number",
                      "description": "The bias score of the word."
                    },
                    "bias_reason": {
                      "type": "string",
                      "description": "The reason for the assigned bias score."
                    }
                  },
                  "required": ["word", "bias_score", "bias_reason"]
                }
              },
              "required": ["word_index_in_sentence", "bias_rating"]
            }
          }
        },
        "required": ["sentence_id", "text", "word_details"]
      }
    }
  },
  "required": ["url", "date_accessed", "content"]
}
