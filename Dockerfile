FROM node
WORKDIR /home/node/app
COPY --chown=node . /home/node/app
VOLUME [ "./logs" ]
RUN chown node logs
RUN npm install
CMD ["npm", "start"]