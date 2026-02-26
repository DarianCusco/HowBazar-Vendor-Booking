FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD python manage.py migrate --noinput && gunicorn vendor_booking.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --log-level debug --access-logfile -

