# API de Pécule : PocketBase avec ses migrations (collections et règles d'accès).
# Les données vivent dans /pb/pb_data, monté sur un volume persistant par Coolify.
FROM alpine:3.22

ARG PB_VERSION=0.40.5

RUN apk add --no-cache ca-certificates unzip wget \
    && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O /tmp/pb.zip \
    && unzip /tmp/pb.zip pocketbase -d /pb \
    && rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations"]
