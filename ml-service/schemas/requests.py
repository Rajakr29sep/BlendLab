from typing import Any
from pydantic import BaseModel, Field

class TexturePreferences(BaseModel):
    hardness: float = Field(default=60, ge=0, le=100)
    chewiness: float = Field(default=60, ge=0, le=100)
    springiness: float = Field(default=55, ge=0, le=100)
    cohesion: float = Field(default=55, ge=0, le=100)

class PredictRequest(BaseModel):
    proteinA: str
    proteinB: str
    feed: float = 35
    ss: float = 600
    mc: float = 28
    texturePreferences: TexturePreferences | dict[str, float] = Field(default_factory=TexturePreferences)

class RecommendRequest(BaseModel):
    feed: float = 35
    ss: float = 600
    mc: float = 28
    texturePreferences: TexturePreferences | dict[str, float] = Field(default_factory=TexturePreferences)
    maxCostPerKg: float | None = None
    minProteinPer100g: float | None = None
    ingredientProfiles: dict[str, dict[str, Any]] = Field(default_factory=dict)
