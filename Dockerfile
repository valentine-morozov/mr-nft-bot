FROM node
WORKDIR /home/node/app
COPY --chown=node . /home/node/app
RUN npm install
CMD ["npm", "start"]