FROM node:12-alpine

LABEL "name"="eslint-action"
LABEL "version"="1.0.0"

COPY LICENSE README.md /
COPY *.js /
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
