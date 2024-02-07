# Not yet needed but just dropping this for later

FROM python:3.11-slim as builder

# Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && curl -sSL https://install.python-poetry.org | python3 - \
    && rm -rf /var/lib/apt/lists/*


# Add openAI to the env
RUN poetry add openai
RUN poetry add python-dotenv

