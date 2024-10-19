# Use Node.js runtime as a parent image
FROM node:latest

# Set the working directory
WORKDIR /app

# Get the build arguments
ARG PGHOST
ARG PGPORT
ARG PGUSER
ARG PGPASSWORD
ARG PGDATABASE
ARG PGSCHEMA

# Set the environment variables
ENV PGHOST=${PGHOST}
ENV PGPORT=${PGPORT}
ENV PGUSER=${PGUSER}
ENV PGPASSWORD=${PGPASSWORD}
ENV PGDATABASE=${PGDATABASE}
ENV PGSCHEMA=${PGSCHEMA}

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Install PostgreSQL and sudo
RUN apt-get update && \
    apt-get install -y postgresql && \
    apt-get install -y sudo

# Create a PostgreSQL user
RUN service postgresql start && \
    sudo -u postgres psql -c "CREATE USER \"${PGUSER}\";" && \
    sudo -u postgres psql -c "ALTER USER \"${PGUSER}\" WITH PASSWORD '${PGPASSWORD}';" && \
    sudo -u postgres psql -c "CREATE DATABASE \"${PGDATABASE}\";" && \
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"${PGDATABASE}\" TO \"${PGUSER}\";"

# Copy the rest of the application code to the container
COPY . .

# Test the application
CMD service postgresql start && \
    npm test
