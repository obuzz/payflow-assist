from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, invoices, reminders, webhooks

app = FastAPI(
    title="PayFlow Assist",
    description="AI-powered payment reminder assistant for small businesses",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(reminders.router)
app.include_router(webhooks.router)


@app.get("/")
async def root():
    return {"message": "PayFlow Assist API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
