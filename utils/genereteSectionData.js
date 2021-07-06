const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const convert = require("xml-js");

const DOCS_PATH = `${__dirname}/docs/`;
const DATA_PATH = `${__dirname}/data/`;
const generateSectionData = async (sectionDirName) => {
  console.log(sectionDirName);
  const sectionData = {
    maps: [],
    topics: [],
  };

  const fileNames = await fsPromises.readdir(`${DOCS_PATH}${sectionDirName}`);

  // const getWriteInStaticDirCollection = (names) =>
  //   names
  //     .filter((name) => EXTENSION_IMG_REGEXP.test(name))
  //     .map(async (name) => {
  //       const file = await fsPromises.readFile(`${DOCS_PATH}${sectionDirName}/${name}`);
  //       return fsPromises.writeFile(`${TOPICS_IMG_PATH}${name}`, file);
  //     });

  // // запись изображений в статическую дирректорию
  // Promise.all(getWriteInStaticDirCollection(fileNames));

  const mapsCatalog = await fsPromises.readdir(
    `${DOCS_PATH}${sectionDirName}/Maps`
  );
  const topicsCatalog = await fsPromises.readdir(
    `${DOCS_PATH}${sectionDirName}/Topics`
  );
  const mapsFile = await fsPromises.readFile(
    path.normalize(`${DOCS_PATH}${sectionDirName}/Maps/${mapsCatalog[0]}`)
  );

  sectionData.topics = await topicsCatalog.reduce(async (acc, fileName) => {
    const topicHrefName = fileName.replace(/\.(xml)$/, "");
    const topicFile = await fsPromises.readFile(
      path.normalize(`${DOCS_PATH}${sectionDirName}/Topics/${fileName}`)
    );
    const topicData = JSON.parse(
      convert.xml2json(topicFile, { compact: true, spaces: 4 })
    );
    // добавление дополнительного аттрибута для связи со списком maps
    topicData.topic._attributes.href = topicHrefName;
    return Promise.resolve([...(await acc), topicData.topic]);
  }, Promise.resolve([]));

  const mapsData = convert.xml2json(mapsFile, { compact: true, spaces: 4 });
  sectionData.maps = JSON.parse(mapsData).map.topicref;
  return sectionData;
};
module.exports.generateSectionData = generateSectionData;
