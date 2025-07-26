import uvicorn

if __name__ == "__main__":
    print("--- Starting FastAPI Server with ScyllaDB Integration (Modularized) ---")
    print(f"Run with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)