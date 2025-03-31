FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables for PostgreSQL connection
# These will be overridden by docker-compose or docker run commands
ENV PGUSER=postgres
ENV PGHOST=postgres
ENV PGPASSWORD=postgres
ENV PGDATABASE=postgres
ENV PGPORT=5432
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
ENV SESSION_SECRET=developmentsecret

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]