FROM node:10-alpine

LABEL "name"="eslint-action"
LABEL "version"="1.0.0"

# Labels for GitHub to read the action
LABEL "com.github.actions.name"="ESLint action with annotations"
LABEL "com.github.actions.description"="An action that runs ESLint and creates annotations for errors and warnings"
LABEL "com.github.actions.icon"="award"
LABEL "com.github.actions.color"="green"

# Labels for GitHub to publish the action
LABEL "repository"="https://github.com/xt0rted/eslint-action"
LABEL "homepage"="https://github.com/xt0rted/eslint-action"
LABEL "maintainer"="Brian Surowiec"

# Copy the action's code
COPY *.js /
COPY entrypoint.sh /entrypoint.sh

# Set execute permissions
RUN chmod +x /entrypoint.sh

# Run `entrypoint.sh`
ENTRYPOINT ["/entrypoint.sh"]
