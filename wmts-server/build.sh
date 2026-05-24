docker run -it --rm \
  -v $(pwd)/data:/data \
  -p 8080:8080 \
  maptiler/tileserver-gl