FROM python:3.11-slim


# set env variable here
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy project
COPY . .

# Expose port here
EXPOSE 8000

# run the backend server
CMD ["uvicorn", "main:webAleaBack", "--host", "0.0.0.0", "--port", "8000"]