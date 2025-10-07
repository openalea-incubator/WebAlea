FROM node:24-slim

WORKDIR /app

# copy project
COPY . .

# install dependencies, build the app then run it
RUN npm install 
RUN npm run build
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]