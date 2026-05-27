FROM nginx:latest

# Copy the custom Nginx configuration.
# No wait-for-it script: docker-compose.yml uses `depends_on: condition: service_healthy`,
# which already blocks startup until the upstream services are healthy.
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
