"""FastAPI Bridge for AutoCare Guide CrewAI Backend."""

import asyncio
import logging
import os
import sys
from typing import List
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from models import AutoCareResponse
from main import run_flow

load_dotenv()

# Setup local logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("autocare.api")

app = FastAPI(
    title="AutoCare Guide API",
    description="FastAPI Bridge for AutoCare Guide CrewAI Backend",
    version="0.1.0"
)

# Configure CORS
allowed_origins: List[str] = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]
cors_env = os.getenv("CORS_ORIGINS")
if cors_env:
    origins_from_env = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    for origin in origins_from_env:
        if origin not in allowed_origins:
            allowed_origins.append(origin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Schema for incoming user chat request."""
    message: str = Field(
        ...,
        description="User vehicle question or message",
        min_length=1,
        max_length=1000
    )

    @field_validator("message")

    def validate_non_empty(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Message must not be empty or whitespace only.")
        return stripped


@app.get("/", tags=["Status"])
def read_root():
    """Root endpoint returning API metadata and running status."""
    return {
        "name": "AutoCare Guide API",
        "status": "running"
    }


@app.get("/health", tags=["Status"])
def health_check():
    """Health check endpoint. Fast and independent of LLM or CrewAI calls."""
    return {
        "status": "ok"
    }


@app.post("/chat", response_model=AutoCareResponse, tags=["Chat"])
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint delegating message execution to the 4-agent CrewAI Flow."""
    logger.info(f"Received chat request: \"{request.message[:50]}...\"")
    try:
        # Run synchronous CrewAI flow safely off the main event loop thread
        result: AutoCareResponse = await asyncio.to_thread(run_flow, request.message)

        # Validate that result is an AutoCareResponse instance
        if not isinstance(result, AutoCareResponse):
            logger.error("CrewAI returned invalid response object type.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An internal error occurred while processing your request. Please try again."
            )

        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Internal error executing CrewAI flow: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing your request. Please try again."
        )
