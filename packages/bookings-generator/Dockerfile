FROM python:3.9

WORKDIR /app

COPY ./.devcontainer/requirements-src.txt ./requirements.txt
RUN pip3 install -r requirements.txt

COPY .env .
COPY ./src ./src

WORKDIR /app/src

CMD ["uvicorn", "main:app", "--host=*"]