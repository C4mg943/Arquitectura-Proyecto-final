FROM nginx:latest

# Copy the wait-for-it.sh script
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Define the entrypoint to wait for services before starting Nginx
ENTRYPOINT ["/usr/local/bin/wait-for-it.sh", "auth-service:3001", "farm-service:3002", "crop-service:3003", "activity-service:3004", "weather-service:3005", "alert-service:3006", "recommendation-service:3007", "report-service:3008", "notification-service:3009", "--", "nginx", "-g", "daemon off;"]
