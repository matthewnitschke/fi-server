FROM node

COPY --from=builder /app/build /app

WORKDIR /app/
ADD server/package.json .
RUN npm install

ADD server .

CMD ["npm", "start"]