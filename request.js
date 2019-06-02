const https = require("https");

module.exports = (url, options) => new Promise((resolve, reject) => {
  const request = https
    .request(url, options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode >= 400) {
          const error = new Error(`Received status code ${response.statusCode}`);
          error.response = response;
          error.data = data;

          reject(error);
        } else {
          resolve({
            data: JSON.parse(data),
            response,
          });
        }
      });
    })
    .on("error", reject);

  if (options.body) {
    request.end(JSON.stringify(options.body));
  } else {
    request.end();
  }
});
