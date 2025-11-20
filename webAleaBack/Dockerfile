FROM continuumio/miniconda3:latest

# set env variable here
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

WORKDIR /app

COPY environment.yml .

# create conda environment
RUN conda env create -f environment.yml

# copy project
COPY . .

# Expose port here
EXPOSE 8000

# ensure channels are present in base conda config
RUN conda config -n webalea_env --add channels conda-forge && \
    conda config -n webalea_env --add channels openalea3 && \
    conda config -n webalea_env --add channels defaults

# run the backend server
CMD ["conda", "run", "-n", "webalea_env", "uvicorn", "main:webAleaBack", "--host", "0.0.0.0", "--port", "8000"]