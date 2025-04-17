# MQTT Snapshot Frigate S3

This project listens to MQTT messages, captures snapshots from Frigate, and uploads them to an S3 bucket. It is designed to run as a Docker container.

## Environment Variables

To run the project, you need to configure the following environment variables:

| Variable Name           | Description                                      | Example Value                |
|-------------------------|--------------------------------------------------|------------------------------|
| `MQTT_BROKER_URL`       | The URL of the MQTT broker.                      | `mqtt://192.168.5.111:1883`  |
| `MQTT_TOPIC`            | The MQTT topic to subscribe to.                  | `frigate/events`             |
| `API_FRIGATE_URL`       | The base URL of the Frigate API.                 | `http://192.168.5.111:5000/api` |
| `AWS_ACCESS_KEY_ID`     | AWS access key ID for S3 access.                 | `your-access-key-id`         |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key for S3 access.             | `your-secret-access-key`     |
| `AWS_REGION`            | AWS region where the S3 bucket is located.       | `us-east-1`                  |
| `S3_BUCKET_NAME`        | The name of the S3 bucket to upload snapshots.   | `my-s3-bucket`               |

### Example `.env` File

Create a `.env` file in the `./mqtt-snapshot-frigate-s3` directory with the following content:

```properties
MQTT_BROKER_URL=mqtt://192.168.5.111:1883
MQTT_TOPIC=frigate/events
API_FRIGATE_URL=http://192.168.5.111:5000/api
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=my-s3-bucket
```
## Docker Compose

To run the project using Docker Compose, create a `docker-compose.yml` file in the `./mqtt-snapshot-frigate-s3` directory with the following content:

```yaml
version: '3.8'
services:
  mqtt-snapshot-frigate-s3:
    image: your-docker-image-name
    container_name: mqtt-snapshot-frigate-s3
    env_file: .env
    restart: unless-stopped
    volumes:
      - ./mqtt-snapshot-frigate-s3:/app
```

## Build and Run

1. Navigate to the `./mqtt-snapshot-frigate-s3` directory.
2. Build the Docker image:

   ```bash
   docker-compose build
   ```


3. Start the Docker container:

   ```bash
    docker-compose up -d
    ```
4. Check the logs to ensure everything is working correctly:
    ```bash
    docker-compose logs -f
    ```
5. You should see logs indicating that the application is connected to the MQTT broker and is listening for messages.
6. When a message is received on the specified MQTT topic, the application will capture a snapshot from Frigate and upload it to the specified S3 bucket.

## Notes
- Ensure that the AWS credentials provided have the necessary permissions to upload files to the specified S3 bucket.