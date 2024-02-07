# Bias Beacon

W210 Capstone Project by:

- Rafael Arbex-Murut
- Georgiy Sekretaryuk
- Sowmya Chandrasekaran
- Yeshwanth Somu

## Introduction

Bias Beacon is a tool designed to detect and highlight bias in text content. It allows users to understand the potential biases present in news articles or any written content by analyzing and scoring the bias of individual words.

## Installation and Setup

This project uses Poetry for dependency management and packaging. To set up the project:

1. Install Poetry by following the instructions on the [official Poetry website](https://python-poetry.org/docs/).

2. Once Poetry is installed, clone the repository and navigate to the project directory:

   ```bash
   git clone https://your-repository-url.git
   cd bias-beacon
   ```

3. Create a Poetry shell which will sandbox our project dependencies:

   ```bash
   poetry shell
   ```

4. Install the project dependencies via Poetry:

   ```bash
   poetry install
   ```

## Running the Model Script

To analyze a word for bias using the model script:

1. Ensure you are within the Poetry shell environment. If not, run `poetry shell` to enter the virtual environment.

2. Run the `run-model` script using Poetry:

   ```bash
   poetry run run-model [WORD]
   ```

   Replace `[WORD]` with the word you want to analyze. For example:

   ```bash
   poetry run run-model "test"
   ```

## Launching the Server

To start the FastAPI server:

1. Ensure you are within the Poetry shell environment and all dependencies are installed.

2. Start the server using the following command:

   ```bash
   uvicorn server.server:app --reload
   ```

   The `--reload` flag enables hot reloading so the server will restart upon changes to the code.

## Usage

After the server is running, you can make requests to the API to analyze text for bias. Use the following endpoint to send a GET request with the query parameter `words` containing the text to analyze:

```plaintext
http://127.0.0.1:8000/api/bias?words=[WORDS]
```
