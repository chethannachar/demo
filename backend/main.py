import logging
import os
from pathlib import Path
from typing import Annotated, NoReturn

import psycopg
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Path as PathParameter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

ROOT_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV_PATH, override=True)

SCHEMA_SQL_PATH = Path(__file__).resolve().parent / "schema.sql"
SCHEMA_SQL = SCHEMA_SQL_PATH.read_text(encoding="utf-8")

DB_HOST = os.getenv("DB_HOST", "").strip()
DB_PORT = os.getenv("DB_PORT", "5432").strip()
DB_NAME = os.getenv("DB_NAME", "").strip()
DB_USER = os.getenv("DB_USER", "").strip()
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

app = FastAPI(title="Record Keeper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://demo-tau-six-58.vercel.app",
        "https://demo-fmjuzxoj1-chethans-projects-92437806.vercel.app",
        "http://localhost:5173",
        *([FRONTEND_URL] if FRONTEND_URL else []),
    ],
    allow_origin_regex=r"^https://demo-[a-z0-9-]+-chethans-projects-92437806\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class RecordInput(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    demo_value: str = Field(min_length=1, max_length=500)

    @field_validator("username", "demo_value", mode="before")
    @classmethod
    def trim_value(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


def connect_to_database() -> psycopg.Connection:
    credentials = (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
    placeholders = {
        "your_database_host",
        "your_database_name",
        "your_database_username",
        "your_database_password",
    }
    if not all(credentials) or any(value in placeholders for value in credentials):
        raise HTTPException(
            status_code=503,
            detail="Database is not configured. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.",
        )
    try:
        port = int(DB_PORT)
    except ValueError as error:
        raise HTTPException(status_code=503, detail="DB_PORT must be a valid port number.") from error
    if not 1 <= port <= 65535:
        raise HTTPException(status_code=503, detail="DB_PORT must be between 1 and 65535.")

    return psycopg.connect(
        host=DB_HOST,
        port=port,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode="require",
        connect_timeout=10,
    )


def create_records_table(connection: psycopg.Connection) -> None:
    connection.execute(SCHEMA_SQL)


def database_unavailable(error: psycopg.Error) -> NoReturn:
    error_type = type(error).__name__
    logging.error("PostgreSQL operation failed (%s)", error_type)
    raise HTTPException(
        status_code=503,
        detail=(
            f"PostgreSQL connection failed ({error_type}). Check DB_HOST, DB_PORT, "
            "DB_NAME, DB_USER, DB_PASSWORD, and the provider's SSL/network settings."
        ),
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/records")
def save_record(record: RecordInput) -> dict[str, str]:
    try:
        with connect_to_database() as connection:
            create_records_table(connection)
            saved_record = connection.execute(
                """
                INSERT INTO records (username, demo_value)
                VALUES (%s, %s)
                ON CONFLICT (username) DO UPDATE
                SET demo_value = EXCLUDED.demo_value,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING username, demo_value
                """,
                (record.username, record.demo_value),
            ).fetchone()
    except psycopg.Error as error:
        database_unavailable(error)

    return {"username": saved_record[0], "demo_value": saved_record[1]}


@app.get("/records/{username}")
def retrieve_record(
    username: Annotated[str, PathParameter(min_length=1, max_length=80)],
) -> dict[str, str]:
    username = username.strip()
    if not username:
        raise HTTPException(status_code=422, detail="Username cannot be empty.")

    try:
        with connect_to_database() as connection:
            create_records_table(connection)
            record = connection.execute(
                "SELECT username, demo_value FROM records WHERE username = %s",
                (username,),
            ).fetchone()
    except psycopg.Error as error:
        database_unavailable(error)

    if record is None:
        raise HTTPException(status_code=404, detail="No record found for that username.")

    return {"username": record[0], "demo_value": record[1]}


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
    )
