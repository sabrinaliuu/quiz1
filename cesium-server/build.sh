docker run -it --rm \
-p 8081:80 \
-v "$(pwd)/terrain":/usr/share/nginx/html \
-v "$(pwd)/building":/usr/share/nginx/html \
-v "$(pwd)/cors.conf":/etc/nginx/conf.d/default.conf \
nginx:alpine