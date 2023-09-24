const fs = require("fs").promises;
const redis = require("ioredis");
const xml2js = require("xml2js");
const xmlFile = process.env.XML_FILE_PATH || "./config.xml";

const storeDataInRedis = async () => {
  const redisClient = new redis({
    host: process.env.REDIS_HOST || "redis",
  });

  try {
    const data = await fs.readFile(xmlFile, "utf8");
    const result = await new Promise((resolve, reject) => {
      xml2js.parseString(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const subdomains = result.config.subdomains[0]?.subdomain || [];
    const subdomainArray = Array.isArray(subdomains)
      ? subdomains
      : [subdomains];

    // Now you can safely map over subdomainArray
    const mappedSubdomains = subdomainArray.map((subdomain) => subdomain);

    await redisClient.set("subdomains", JSON.stringify(mappedSubdomains));

    await Promise.all(
      result.config.cookies[0].cookie.map(async (cookie) => {
        const { name, host } = cookie.$;
        const value = cookie._;
        await redisClient.set(`cookie:${name}:${host}`, value);
      })
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    redisClient.quit();
  }
};

storeDataInRedis();

module.exports = {
  storeDataInRedis,
};
