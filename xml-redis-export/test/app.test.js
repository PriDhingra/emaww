const fs = require("fs").promises;
const redis = require("ioredis");
const mock = require("mock-fs");

const { storeDataInRedis } = require("../app");

jest.mock("ioredis", () => {
  const mRedis = {
    set: jest.fn(),
    quit: jest.fn(),
  };
  return jest.fn(() => mRedis);
});

describe("storeDataInRedis", () => {
  beforeAll(() => {
    mock({
      "../config.xml":
        "<config><subdomains>...</subdomains><cookies>...</cookies></config>",
    });
  });

  afterAll(() => {
    mock.restore();
  });

  it("reads XML and sets data in Redis", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        '<config><subdomains><subdomain>http://secureline.tools.avast.com</subdomain><subdomain>http://example.com</subdomain></subdomains><cookies><cookie name="name1" host="host1">value1</cookie><cookie name="name2" host="host2">value2</cookie></cookies></config>'
      );

    const mRedisClient = new redis();

    await storeDataInRedis();

    expect(mRedisClient.set).toHaveBeenCalledWith(
      "subdomains",
      JSON.stringify([
        "http://secureline.tools.avast.com",
        "http://example.com",
      ])
    );
    expect(mRedisClient.set).toHaveBeenCalledWith(
      "cookie:name1:host1",
      "value1"
    );
    expect(mRedisClient.set).toHaveBeenCalledWith(
      "cookie:name2:host2",
      "value2"
    );

    expect(mRedisClient.quit).toHaveBeenCalled();
  });

  it("enters the catch block on error", async () => {
    jest.spyOn(fs, "readFile").mockRejectedValue(new Error("File read error"));

    const mRedisClient = new redis();

    try {
      await storeDataInRedis();
    } catch (error) {
      expect(error.message).toBe("File read error");
    }

    expect(mRedisClient.quit).toHaveBeenCalled();
  });
});
