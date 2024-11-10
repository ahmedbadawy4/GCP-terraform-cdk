# TypeScript / Node / Express application instructions
To run this application locally for testing purposes, follow these instructions:

 1. If you have `node`/`npm` installed (tested on node v16), `cd` into this `application` directory then skip to step 3
 2. Install Docker and run `docker run -it -v $(pwd):/app -p 3000:3000 node:16 /bin/bash` then `cd /app`
 3. Run `npm install`
 4. Run `npm run start:dev`
 5. Navigate to your `http://localhost:3000` in your browser

For more production-like purposes, you can build the application using the following steps:

 1. `npm run build`
 2. Built files output to `./build` directory
 3. Run `node build/index.js` to run the Express server