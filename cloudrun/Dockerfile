FROM node:20-bullseye-slim

RUN apt-get -y update
RUN apt-get -y install curl
RUN mkdir -p /usr/app/theme
RUN curl -C - -o /usr/app/listing.csv https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_file_list.csv
RUN echo "jtex: v1" > /usr/app/theme/template.yml

RUN npm update -g npm
RUN apt-get -y install webp
RUN apt-get -y install ghostscript
RUN apt-get -y install imagemagick
RUN apt-get -y install zip unzip
RUN apt-get -y install inkscape
RUN convert -version

WORKDIR /usr/app

ADD index.js index.js
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install

CMD ["npm", "run", "start"]