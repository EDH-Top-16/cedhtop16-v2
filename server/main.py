from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from routers import commanders_router, tournaments_router
from db import base_db


app = FastAPI()


"""
Set up for logger
"""
logging.basicConfig(
    level=logging.WARNING,
)


"""
All routes
"""
prefix = "/api"
app.include_router(commanders_router, prefix=prefix)
app.include_router(tournaments_router, prefix=prefix)


"""
CORS setup to allow requests from localhost:3000
"""
origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


"""
App startup and shutdown scripts
"""


@app.on_event("startup")
async def startup():
    await base_db.startup()


@app.on_event("shutdown")
async def shutdown():
    await base_db.shutdown()
