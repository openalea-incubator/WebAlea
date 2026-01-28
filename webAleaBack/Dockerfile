FROM continuumio/miniconda3:24.11.1-0

# set env variable here
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app
ENV PYTHONPATH="${APP_HOME}:${PYTHONPATH}"

WORKDIR /app

COPY environment.yml .

# create conda environment
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# if env conda already exists\n\
if [ ! -d "/opt/conda/envs/webalea_env/bin" ]; then\n\
  echo "Creating conda environment..."\n\
  conda env create -f /app/environment.yml\n\
else\n\
  echo "Conda environment already exists."\n\
fi\n\
\n\
# Execute command\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

# copy project
COPY . .

# Expose port here
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
# run the backend server
CMD ["conda", "run", "-n", "webalea_env", "uvicorn", "main:webAleaBack", "--host", "0.0.0.0", "--port", "8000"]