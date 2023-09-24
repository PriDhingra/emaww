#!/bin/bash

while getopts ":v" opt; do
  case $opt in
    v)
      PRINT_KEYS=true
      ;;
  esac
done

shift $((OPTIND-1))

# Check if path for xml file is there
if [ $# -eq 1 ]; then
  XML_FILE_PATH="$1"
else
  echo "Usage: $0 [-v] /path/to/xml"
  exit 1
fi

# Set XML_FILE_PATH as an environment variable
export XML_FILE_PATH="$XML_FILE_PATH"

docker-compose -f docker-compose.yml up --build -d

CONTAINER_NAME=$(docker-compose -f docker-compose.yml ps -q xml-redis-export)

docker-compose -f docker-compose.yml exec "$CONTAINER_NAME" /bin/bash -c \
  "npm install && node app.js"

docker-compose -f docker-compose.yml logs -f xml-redis-export

if [ "$PRINT_KEYS" = true ]; then
  docker-compose -f docker-compose.yml exec redis redis-cli keys '*'
fi

docker-compose -f docker-compose.yml down
