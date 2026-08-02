from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core import config
from app.db.base import Base
from app.db.session import engine

Base.metadata.create_all(bind=engine)
app = FastAPI(title="SmartSpend AI")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=[config.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SmartSPend AI API is running"}

if __name__ =="__main__":
    import uvicorn
    uvicorn.run("main.py", host="0.0.0.0", port=8000, reload=True)