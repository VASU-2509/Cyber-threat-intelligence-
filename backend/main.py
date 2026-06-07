from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import init_db
from api.routes import router

app = FastAPI(title="Cyber Threat Intelligence Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
def root():
    return {"message": "Cyber Threat Intelligence Platform API"}

app.include_router(router, prefix="/api")